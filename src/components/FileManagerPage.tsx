import {useEffect, useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Button} from '@cloudflare/kumo/components/button';
import {Empty} from '@cloudflare/kumo/components/empty';
import {Table} from '@cloudflare/kumo/components/table';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {DownloadSimple, Eye, FileArrowUp, Trash} from '@phosphor-icons/react';
import {useTranslation} from 'react-i18next';
import {enterpriseApi} from '../services/enterpriseApi';
import type {ManagedFile} from '../types';
import {Card, PageTitle, Skeleton, StatusBadge} from './kumo-ui';
import {FilePreviewDialog} from './FilePreviewDialog';

function bytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

export function FileManagerPage({permissionCodes}: {permissionCodes: string[]}) {
  const {t} = useTranslation('enterprise');
  const toasts = useKumoToastManager();
  const picker = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [previewState, setPreviewState] = useState<{file:ManagedFile;url:string;mimeType:string;error:string}|null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const filesQuery = useQuery({
    queryKey: ['files'],
    queryFn: () => enterpriseApi.files({page: 1, pageSize: 100, sortKey: 'createdAt', sortDirection: 'desc'}),
  });
  const rows: ManagedFile[] = filesQuery.data?.items ?? [];
  const loading = filesQuery.isLoading || filesQuery.isFetching;

  useEffect(() => {
    if (filesQuery.error) toasts.add({title: filesQuery.error instanceof Error ? filesQuery.error.message : t('loadFailed'), variant: 'error'});
  }, [filesQuery.error, t, toasts]);

  const uploadMutation = useMutation({
    mutationFn: enterpriseApi.uploadFile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['files']});
      toasts.add({title: t('files.uploaded'), variant: 'success'});
    },
    onError: error => toasts.add({title: error instanceof Error ? error.message : t('files.uploadFailed'), variant: 'error'}),
    onSettled: () => { if (picker.current) picker.current.value = ''; },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => enterpriseApi.deleteFile(id),
    onError: error => toasts.add({title: error instanceof Error ? error.message : t('files.deleteFailed'), variant: 'error'}),
    onSettled: async () => { await queryClient.invalidateQueries({queryKey: ['files']}); },
  });
  const busy = uploadMutation.isPending || deleteMutation.isPending;
  const permissions = new Set(permissionCodes);
  const canAccessContent = permissions.has('files.download');
  const upload = async (file: File) => { await uploadMutation.mutateAsync(file).catch(() => undefined); };
  const download = async (row: ManagedFile) => {
    try {
      const result = await enterpriseApi.downloadFile(row.id);
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      link.rel = 'noopener';
      link.click();
    } catch (error) {
      toasts.add({title: error instanceof Error ? error.message : t('files.downloadFailed'), variant: 'error'});
    }
  };
  const preview = async (row: ManagedFile) => {
    setPreviewState({file:row,url:'',mimeType:row.mimeType,error:''});
    setPreviewingId(row.id);
    try {
      const result = await enterpriseApi.previewFile(row.id);
      setPreviewState({file:row,url:result.url,mimeType:result.mimeType,error:''});
    } catch (error) {
      const message=error instanceof Error?error.message:t('files.previewFailed');
      setPreviewState({file:row,url:'',mimeType:row.mimeType,error:message});
    } finally {
      setPreviewingId(null);
    }
  };
  const remove = async (row: ManagedFile) => {
    if (!window.confirm(t('files.deleteConfirm', {name: row.originalName}))) return;
    await deleteMutation.mutateAsync(row.id).catch(() => undefined);
  };
  const totalBytes = rows.reduce((sum, row) => sum + row.sizeBytes, 0);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageTitle title={t('files.title')} actions={permissions.has('files.upload') ? <><input ref={picker} className="sr-only" type="file" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); }} /><Button icon={FileArrowUp} disabled={busy} onClick={() => picker.current?.click()}>{busy ? t('files.uploading') : t('files.upload')}</Button></> : undefined} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><Text size="sm" variant="secondary">{t('files.count')}</Text><Text as="p" variant="heading2">{rows.length}</Text></Card>
        <Card className="p-4"><Text size="sm" variant="secondary">{t('files.size')}</Text><Text as="p" variant="heading2">{bytes(totalBytes)}</Text></Card>
        <Card className="p-4"><Text size="sm" variant="secondary">{t('files.visibility')}</Text><Text as="p" variant="heading2">{t('files.private')}</Text></Card>
      </div>
      <Card className="overflow-hidden p-0"><div className="overflow-x-auto">
        {loading ? <Table style={{minWidth:'60rem'}} aria-label={t('files.title')}><Table.Header><Table.Row>{Array.from({length:7},(_,index)=><Table.Head key={index}><Skeleton className="h-4 w-24" /></Table.Head>)}</Table.Row></Table.Header><Table.Body>{Array.from({length:6},(_,rowIndex)=><Table.Row key={rowIndex}>{Array.from({length:7},(_,cellIndex)=><Table.Cell key={cellIndex}><Skeleton className={`h-5 ${cellIndex===0?'w-32':'w-20'}`} /></Table.Cell>)}</Table.Row>)}</Table.Body></Table> : rows.length ? <Table style={{minWidth: '60rem'}}>
          <Table.Header><Table.Row><Table.Head>{t('files.name')}</Table.Head><Table.Head>{t('files.type')}</Table.Head><Table.Head>{t('files.size')}</Table.Head><Table.Head>{t('files.uploader')}</Table.Head><Table.Head>{t('files.created')}</Table.Head><Table.Head>{t('files.status')}</Table.Head><Table.Head>{t('files.actions')}</Table.Head></Table.Row></Table.Header>
          <Table.Body>{rows.map(row => <Table.Row key={row.id}>
            <Table.Cell><Text bold>{row.originalName}</Text></Table.Cell><Table.Cell>{row.mimeType}</Table.Cell><Table.Cell>{bytes(row.sizeBytes)}</Table.Cell><Table.Cell>{row.uploadedBy}</Table.Cell><Table.Cell>{new Date(row.createdAt).toLocaleString()}</Table.Cell><Table.Cell><StatusBadge tone={row.status === 'ready' ? 'success' : row.status === 'quarantined' ? 'warning' : 'error'}>{t(`files.${row.status}`, {defaultValue:row.status})}</StatusBadge></Table.Cell>
            <Table.Cell><div className="flex gap-1">{canAccessContent ? <><Button size="sm" variant="secondary" icon={Eye} loading={previewingId === row.id} disabled={row.status !== 'ready'} onClick={() => void preview(row)}>{previewingId === row.id ? t('files.previewing') : t('files.preview')}</Button><Button size="sm" variant="secondary" icon={DownloadSimple} disabled={row.status !== 'ready'} onClick={() => void download(row)}>{t('files.download')}</Button></> : null}{permissions.has('files.delete') ? <Button size="sm" variant="secondary-destructive" icon={Trash} onClick={() => void remove(row)}>{t('files.delete')}</Button> : null}</div></Table.Cell>
          </Table.Row>)}</Table.Body>
        </Table> : <Empty size="sm" title={t('files.empty')} description={t('files.emptyHint')} />}
      </div></Card>
      <FilePreviewDialog file={previewState?.file??null} url={previewState?.url??''} mimeType={previewState?.mimeType??''} loading={Boolean(previewState&&previewingId===previewState.file.id)} error={previewState?.error??''} onClose={()=>setPreviewState(null)} onRefresh={()=>previewState&&void preview(previewState.file)} onDownload={()=>previewState&&void download(previewState.file)}/>
    </div>
  );
}
