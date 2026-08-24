import {createHash} from 'node:crypto';
import {HttpException,HttpStatus,Injectable,Logger} from '@nestjs/common';

type AttemptWindow={startedAt:number;count:number};

@Injectable()
export class AuthRateLimitService {
  private readonly attempts=new Map<string,AttemptWindow>();
  private readonly logger=new Logger('AuthSecurity');

  consume(scope:string,identifiers:string[],limit:number,windowMs:number) {
    if(process.env.AUTH_RATE_LIMIT_ENABLED==='false') return;
    const now=Date.now();
    for(const identifier of identifiers){
      const digest=createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
      const key=`${scope}:${digest}`;
      const current=this.attempts.get(key);
      const window=!current||now-current.startedAt>=windowMs?{startedAt:now,count:0}:current;
      window.count+=1;
      this.attempts.set(key,window);
      if(window.count>limit){
        this.logger.warn(JSON.stringify({event:'auth_rate_limited',scope,identifierHash:digest.slice(0,16)}));
        throw new HttpException({code:'AUTH_RATE_LIMITED',retryAfterSeconds:Math.ceil((window.startedAt+windowMs-now)/1000)},HttpStatus.TOO_MANY_REQUESTS);
      }
    }
    this.prune(now);
  }

  recordFailure(scope:string,identifier:string) {
    const identifierHash=createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex').slice(0,16);
    this.logger.warn(JSON.stringify({event:'auth_failed',scope,identifierHash}));
  }

  clear(scope:string,identifiers:string[]) {
    for(const identifier of identifiers){
      const digest=createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
      this.attempts.delete(`${scope}:${digest}`);
    }
  }

  private prune(now:number) {
    if(this.attempts.size<10_000) return;
    for(const [key,window] of this.attempts){
      if(now-window.startedAt>24*60*60*1000) this.attempts.delete(key);
    }
  }
}
