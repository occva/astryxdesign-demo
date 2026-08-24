import {useEffect,useState} from 'react';
import {Badge} from '@cloudflare/kumo/components/badge';
import {Button,RefreshButton} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Empty} from '@cloudflare/kumo/components/empty';
import {Loader} from '@cloudflare/kumo/components/loader';
import {Text} from '@cloudflare/kumo/components/text';
import {DownloadSimple,FileText,WarningCircle,X} from '@phosphor-icons/react';
import {useTranslation} from 'react-i18next';
import type {ManagedFile} from '../types';

const MAX_TEXT_PREVIEW_BYTES=1024*1024;

type PreviewKind='image'|'pdf'|'video'|'audio'|'text'|'unsupported';

function previewKind(mimeType:string):PreviewKind {
  const mime=mimeType.split(';')[0].trim().toLowerCase();
  if(mime==='application/pdf') return 'pdf';
  if(mime.startsWith('image/')&&mime!=='image/svg+xml') return 'image';
  if(mime.startsWith('video/')) return 'video';
  if(mime.startsWith('audio/')) return 'audio';
  if(mime.startsWith('text/')||['application/json','application/xml','application/javascript'].includes(mime)) return 'text';
  return 'unsupported';
}

function LoadingStage({label}:{label:string}) {
  return <div className="grid h-full place-items-center"><Loader size="lg" aria-label={label}/></div>;
}

function ErrorStage({title,description}:{title:string;description:string}) {
  return <div className="grid h-full min-h-64 place-items-center p-6"><Empty size="sm" icon={<WarningCircle/>} title={title} description={description}/></div>;
}

function TextPreview({file,url}:{file:ManagedFile;url:string}) {
  const {t}=useTranslation('enterprise');
  const [content,setContent]=useState<string>();
  const [error,setError]=useState('');
  useEffect(()=>{
    if(file.sizeBytes>MAX_TEXT_PREVIEW_BYTES){setContent(undefined);setError(t('files.textTooLarge'));return;}
    const controller=new AbortController();
    setContent(undefined);setError('');
    fetch(url,{signal:controller.signal}).then(response=>{
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    }).then(setContent).catch(reason=>{
      if(reason instanceof DOMException&&reason.name==='AbortError') return;
      setError(t('files.contentLoadFailed'));
    });
    return ()=>controller.abort();
  },[file.sizeBytes,t,url]);
  if(error) return <ErrorStage title={t('files.previewUnavailable')} description={error}/>;
  if(content===undefined) return <LoadingStage label={t('files.loadingContent')}/>;
  return <pre className="h-full overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-sm leading-6 text-kumo-default" tabIndex={0}>{content||t('files.emptyTextFile')}</pre>;
}

function MediaPreview({file,url,mimeType,kind}:{file:ManagedFile;url:string;mimeType:string;kind:Exclude<PreviewKind,'text'|'unsupported'>}) {
  const {t}=useTranslation('enterprise');
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[url]);
  if(failed) return <ErrorStage title={t('files.previewUnavailable')} description={t('files.mediaLoadFailed')}/>;
  if(kind==='image') return <div className="grid h-full place-items-center overflow-auto p-5"><img className="max-h-full max-w-full rounded-lg object-contain shadow-sm" src={url} alt={file.originalName} onError={()=>setFailed(true)}/></div>;
  if(kind==='pdf') return <object className="h-full min-h-96 w-full bg-white" data={url} type="application/pdf" aria-label={file.originalName}><ErrorStage title={t('files.previewUnavailable')} description={t('files.pdfUnsupported')}/></object>;
  if(kind==='video') return <div className="grid h-full place-items-center bg-black/90 p-5"><video className="max-h-full max-w-full" src={url} controls preload="metadata" onError={()=>setFailed(true)}>{t('files.mediaUnsupported')}</video></div>;
  return <div className="grid h-full place-items-center p-8"><div className="w-full max-w-2xl rounded-xl border border-kumo-line bg-kumo-base p-6 shadow-sm"><Text as="p" bold>{file.originalName}</Text><Text as="p" size="sm" variant="secondary">{mimeType}</Text><audio className="mt-5 w-full" src={url} controls preload="metadata" onError={()=>setFailed(true)}>{t('files.mediaUnsupported')}</audio></div></div>;
}

export function FilePreviewDialog({file,url,mimeType,loading,error,onClose,onRefresh,onDownload}:{
  file:ManagedFile|null;url:string;mimeType:string;loading:boolean;error:string;
  onClose:()=>void;onRefresh:()=>void;onDownload:()=>void;
}) {
  const {t}=useTranslation('enterprise');
  const kind=previewKind(mimeType||file?.mimeType||'');
  return <Dialog.Root open={file!==null} onOpenChange={open=>!open&&onClose()}>
    <Dialog className="top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 rounded-none p-0 ring-0 sm:w-full">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-kumo-line px-5 py-4">
          <div className="min-w-0">
            <Dialog.Title className="truncate">{file?.originalName??t('files.preview')}</Dialog.Title>
            {file?<div className="mt-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{mimeType||file.mimeType}</Badge><Text size="sm" variant="secondary">{t('files.previewSize',{size:file.sizeBytes<1024?`${file.sizeBytes} B`:file.sizeBytes<1024**2?`${(file.sizeBytes/1024).toFixed(1)} KB`:`${(file.sizeBytes/1024**2).toFixed(1)} MB`})}</Text></div>:null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RefreshButton size="sm" variant="ghost" loading={loading} title={t('files.refreshPreview')} onClick={onRefresh}/>
            <Button size="sm" shape="square" variant="ghost" icon={DownloadSimple} title={t('files.download')} onClick={onDownload}/>
            <Dialog.Close render={<Button size="sm" shape="square" variant="ghost" icon={X} title={t('files.closePreview')}/>}/>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-kumo-tint">
          {loading?<LoadingStage label={t('files.previewing')}/>:error?<ErrorStage title={t('files.previewUnavailable')} description={error}/>:file&&url?kind==='text'?<TextPreview file={file} url={url}/>:kind==='unsupported'?<div className="grid h-full place-items-center p-6"><Empty size="sm" icon={<FileText/>} title={t('files.unsupportedPreview')} description={t('files.unsupportedPreviewHint')}/></div>:<MediaPreview file={file} url={url} mimeType={mimeType} kind={kind}/>:null}
        </div>
      </div>
    </Dialog>
  </Dialog.Root>;
}
