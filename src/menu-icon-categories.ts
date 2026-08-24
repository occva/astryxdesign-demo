export const menuIconCategories = ['recommended','people','organization','data','files','communication','security','system','navigation','all'] as const;
export type MenuIconCategory = typeof menuIconCategories[number];

export const recommendedMenuIcons = new Set([
  'HouseIcon','GaugeIcon','ChartBarIcon','ChartLineIcon','TableIcon','DatabaseIcon','UsersIcon','UserIcon',
  'UserGearIcon','IdentificationCardIcon','TreeStructureIcon','BuildingsIcon','BriefcaseIcon','ShieldCheckIcon',
  'KeyIcon','LockKeyIcon','GearSixIcon','SlidersHorizontalIcon','ListBulletsIcon','SquaresFourIcon','FolderIcon',
  'FileIcon','FilesIcon','ArchiveIcon','ClipboardTextIcon','NoteIcon','BellIcon','EnvelopeIcon','ChatTextIcon',
  'CalendarIcon','ClockIcon','MagnifyingGlassIcon','UploadIcon','DownloadIcon','CloudIcon','GlobeIcon','MapPinIcon',
]);

export const iconCategoryKeywords: Partial<Record<MenuIconCategory, RegExp>> = {
  people: /(User|Users|Person|Identification|AddressBook|Contact|Team|Student|Employee|Briefcase)/i,
  organization: /(Tree|Building|Office|Hierarchy|Flow|Graph|Network|ShareNetwork|GitBranch)/i,
  data: /(Chart|Table|Database|Gauge|Trend|Presentation|Rows|Columns|Grid|List|Squares)/i,
  files: /(File|Folder|Archive|Clipboard|Note|Paper|Book|Document)/i,
  communication: /(Bell|Chat|Envelope|Phone|Megaphone|Broadcast|Notification|At|Mailbox)/i,
  security: /(Shield|Lock|Key|Fingerprint|Password|Eye|Certificate|Seal|Warning)/i,
  system: /(Gear|Sliders|Wrench|Tool|Code|Terminal|Cpu|Cloud|Globe|Browser|AppWindow)/i,
  navigation: /(Arrow|Caret|House|Map|Compass|Path|Signpost|Navigation|Crosshair)/i,
};

export function menuIconCategory(name: string): Exclude<MenuIconCategory, 'all'> {
  if (recommendedMenuIcons.has(name)) return 'recommended';
  return (Object.entries(iconCategoryKeywords).find(([, pattern]) => pattern.test(name))?.[0] as Exclude<MenuIconCategory, 'all'> | undefined) ?? 'system';
}

export function menuIconChunk(name: string) {
  const category = menuIconCategory(name);
  return category === 'system' ? `system-${name[0].toLowerCase()}` : category;
}
