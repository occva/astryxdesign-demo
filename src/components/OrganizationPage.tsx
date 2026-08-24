import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Button} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Empty} from '@cloudflare/kumo/components/empty';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {
  ArrowsClockwise,
  DownloadSimple,
  TreeStructure,
  UploadSimple,
} from '@phosphor-icons/react';
import {useTranslation} from 'react-i18next';
import {enterpriseApi} from '../services/enterpriseApi';
import type {DepartmentImportPreview, DepartmentNode, ResourceSchema} from '../types';
import {Card, Skeleton} from './kumo-ui';
import {ResourcePage} from './ResourcePage';

const OrganizationFlow = lazy(() => import('./OrganizationFlow').then(module => ({default: module.OrganizationFlow})));

type DepartmentTree = {
  items: DepartmentNode[];
  total: number;
  enabled: number;
  members: number;
};

function expandableIds(nodes: DepartmentNode[]): string[] {
  return nodes.flatMap(node => [
    ...(node.children.length || node.people.length ? [node.id] : []),
    ...expandableIds(node.children),
  ]);
}

function OrganizationFlowSkeleton() {
  return (
    <div className="flex min-w-[64rem] items-center gap-12 p-12">
      <Skeleton className="h-32 w-64" />
      <div className="grid gap-5">
        <Skeleton className="h-28 w-64" />
        <Skeleton className="h-28 w-64" />
        <Skeleton className="h-28 w-64" />
      </div>
    </div>
  );
}

export function OrganizationPage({
  schema,
  permissionCodes,
  onResourceChanged,
}: {
  schema: ResourceSchema;
  permissionCodes: string[];
  onResourceChanged?: (resourceId: string) => void;
}) {
  const {t} = useTranslation('enterprise');
  const toasts = useKumoToastManager();
  const queryClient = useQueryClient();
  const picker = useRef<HTMLInputElement>(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<DepartmentImportPreview | null>(null);
  const canImport = permissionCodes.includes('departments.import');
  const treeQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: enterpriseApi.departmentTree,
    enabled: treeOpen,
  });
  const tree: DepartmentTree | null = treeQuery.data ?? null;
  const loading = treeQuery.isLoading || treeQuery.isFetching;

  useEffect(() => {
    if (treeQuery.data) {
      setExpanded(current => current.size ? current : new Set(treeQuery.data.items.map(item => item.id)));
    }
  }, [treeQuery.data]);

  useEffect(() => {
    if (treeQuery.error) {
      toasts.add({title: treeQuery.error instanceof Error ? treeQuery.error.message : t('loadFailed'), variant: 'error'});
    }
  }, [treeQuery.error, t, toasts]);

  const previewMutation = useMutation({
    mutationFn: enterpriseApi.previewDepartmentImport,
    onSuccess: setPreview,
    onError: error => toasts.add({title: error instanceof Error ? error.message : t('organization.previewFailed'), variant: 'error'}),
  });
  const importMutation = useMutation({
    mutationFn: enterpriseApi.importDepartments,
    onSuccess: async result => {
      toasts.add({title: t('organization.imported', {count: result.total}), variant: 'success'});
      setPreview(null);
      setCsv('');
      await queryClient.invalidateQueries({queryKey: ['department-tree']});
      onResourceChanged?.('departments');
    },
    onError: error => toasts.add({title: error instanceof Error ? error.message : t('organization.importFailed'), variant: 'error'}),
  });
  const importing = importMutation.isPending;

  const exportCsv = async () => {
    try {
      const content = await enterpriseApi.exportDepartments();
      const url = URL.createObjectURL(new Blob([content], {type: 'text/csv;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'departments.csv';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      toasts.add({title: error instanceof Error ? error.message : t('organization.exportFailed'), variant: 'error'});
    }
  };

  const chooseCsv = async (file: File) => {
    const content = await file.text();
    setCsv(content);
    await previewMutation.mutateAsync(content).catch(() => undefined);
  };

  const commit = async () => {
    if (!preview || preview.errors.length) return;
    await importMutation.mutateAsync(csv).catch(() => undefined);
  };

  const headerActions = (
    <>
      <Button variant="secondary" icon={TreeStructure} onClick={() => setTreeOpen(true)}>
        {t('organization.openTree')}
      </Button>
      <Button variant="secondary" icon={DownloadSimple} onClick={() => void exportCsv()}>
        {t('organization.export')}
      </Button>
      {canImport ? (
        <>
          <input
            ref={picker}
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void chooseCsv(file);
              event.currentTarget.value = '';
            }}
          />
          <Button variant="secondary" icon={UploadSimple} onClick={() => picker.current?.click()}>
            {t('organization.import')}
          </Button>
        </>
      ) : null}
    </>
  );

  const nodeLabels = {
    expand: t('organization.expandNode'),
    collapse: t('organization.collapseNode'),
    owner: t('organization.owner'),
    directMembers: t('organization.directMembers'),
    totalMembers: t('organization.totalMembers'),
    enabled: t('organization.enabledStatus'),
    disabled: t('organization.disabledStatus'),
    employee: t('organization.employee'),
    noJobTitle: t('organization.noJobTitle'),
    enabledPerson: t('organization.enabledPerson'),
    disabledPerson: t('organization.disabledPerson'),
    canvasAriaLabel: t('organization.canvasAriaLabel'),
    zoomIn: t('organization.zoomIn'),
    zoomOut: t('organization.zoomOut'),
    fitView: t('organization.fitView'),
  };

  return (
    <>
      <ResourcePage
        schema={schema}
        permissionCodes={permissionCodes}
        headerActions={headerActions}
        hideExport
        onResourceChanged={resource => {
          void queryClient.invalidateQueries({queryKey: ['department-tree']});
          onResourceChanged?.(resource);
        }}
      />

      <Dialog.Root open={treeOpen} onOpenChange={setTreeOpen}>
        <Dialog
          size="xl"
          className="h-[calc(100dvh-1rem)]! w-[calc(100vw-1rem)]! max-w-none! overflow-hidden p-0"
        >
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-kumo-line bg-kumo-elevated px-5 py-4">
              <div>
                <Dialog.Title>{t('organization.canvasTitle')}</Dialog.Title>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" disabled={!tree?.items.length} onClick={() => setExpanded(new Set(expandableIds(tree?.items ?? [])))}>
                  {t('organization.expandAll')}
                </Button>
                <Button size="sm" variant="secondary" disabled={!tree?.items.length} onClick={() => setExpanded(new Set())}>
                  {t('organization.collapseAll')}
                </Button>
                <Button size="sm" shape="square" variant="secondary" icon={ArrowsClockwise} aria-label={t('organization.refreshTree')} onClick={() => void treeQuery.refetch()} />
                <Dialog.Close render={<Button size="sm" variant="secondary">{t('cancel')}</Button>} />
              </div>
            </header>
            <div className="organization-flow-shell min-h-0 flex-1" aria-busy={loading}>
              {loading ? (
                <OrganizationFlowSkeleton />
              ) : tree?.items.length ? (
                <Suspense fallback={<OrganizationFlowSkeleton />}>
                  <OrganizationFlow
                    items={tree.items}
                    expanded={expanded}
                    onToggle={id => setExpanded(current => {
                        const next = new Set(current);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })}
                    labels={nodeLabels}
                  />
                </Suspense>
              ) : (
                <div className="grid h-full place-items-center p-8">
                  <Empty size="sm" title={t('organization.empty')} description={t('organization.emptyHint')} />
                </div>
              )}
            </div>
          </div>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={preview !== null} onOpenChange={open => !open && setPreview(null)}>
        <Dialog size="xl" className="max-h-[82dvh] overflow-hidden p-0">
          <div className="flex max-h-[82dvh] flex-col">
            <Dialog.Title className="border-b border-kumo-line px-6 py-5">{t('organization.previewTitle')}</Dialog.Title>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-3"><Text size="sm" variant="secondary">{t('organization.total')}</Text><Text as="p" variant="heading3">{preview?.total ?? 0}</Text></Card>
                <Card className="p-3"><Text size="sm" variant="secondary">{t('organization.created')}</Text><Text as="p" variant="heading3">{preview?.created ?? 0}</Text></Card>
                <Card className="p-3"><Text size="sm" variant="secondary">{t('organization.updatedCount')}</Text><Text as="p" variant="heading3">{preview?.updated ?? 0}</Text></Card>
              </div>
              {preview?.errors.length ? (
                <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <Text bold>{t('organization.errors', {count: preview.errors.length})}</Text>
                  <ul className="mt-2 space-y-1 text-sm">
                    {preview.errors.slice(0, 100).map((error, index) => (
                      <li key={index}>{t('organization.line', {line: error.line})} · {error.field}: {error.message}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/5 p-4"><Text bold>{t('organization.ready')}</Text></div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-kumo-line px-6 py-4">
              <Dialog.Close render={<Button variant="secondary">{t('cancel')}</Button>} />
              <Button disabled={Boolean(preview?.errors.length) || importing} onClick={() => void commit()}>
                {importing ? t('organization.importing') : t('organization.confirm')}
              </Button>
            </div>
          </div>
        </Dialog>
      </Dialog.Root>
    </>
  );
}
