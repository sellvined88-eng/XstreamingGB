import React, {useMemo, useState} from 'react';
import {
  Check,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileCode2,
  FolderGit2,
  Gamepad2,
  HardDrive,
  Search,
  ShieldCheck,
  Tablet,
  Terminal,
  Wrench,
} from 'lucide-react';
import {
  AUDIT_ITEMS,
  AuditItem,
  DEVICE_PROFILE,
  RECOMMENDED_PRESETS,
  ZIP_METADATA,
} from './data/auditData';

type FilterCategory = 'all' | AuditItem['category'];

const CATEGORY_TABS: Array<{id: FilterCategory; label: string}> = [
  {id: 'all', label: 'Todos (23)'},
  {id: 'java-api24', label: 'Java API 24 (13)'},
  {id: 'gradle-cpp', label: 'Gradle & C++ (5)'},
  {id: 'rn-js', label: 'React Native / JS (3)'},
  {id: 'ci-patches', label: 'CI & Parches (2)'},
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [buildTab, setBuildTab] = useState<'github' | 'local' | 'asus'>('github');

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return AUDIT_ITEMS.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.file.toLowerCase().includes(query) ||
        item.blocker.toLowerCase().includes(query) ||
        item.adaptation.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query)
      );
    });
  }, [selectedCategory, searchQuery]);

  const copyText = (id: string, value: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(current => (current === id ? null : current)), 1800);
      });
    }
  };

  const gitPushScript = `unzip ${ZIP_METADATA.filename}
cd xstreaming-android7
git init
git add .
git commit -m "XStreaming 2.12.0 adapted for Android 7.0 (API 24)"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main`;

  const localBuildScript = `cd xstreaming-android7
corepack enable
corepack yarn install --immutable
chmod +x android/gradlew
cd android
# Solo ARM64 (ideal ASUS P008):
./gradlew assembleProdRelease -PreactNativeArchitectures=arm64-v8a`;

  const adbInstallScript = `# Conectar ASUS P008 con Depuración USB activada
adb devices
adb install -r android/app/build/outputs/apk/prod/release/app-prod-release.apk`;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F3F4F6] flex flex-col">
      {/* Sticky 3-Zone Engineering Header */}
      <header className="sticky top-0 z-30 border-b border-[#1E293B] bg-[#0B0F17]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-[#F3F4F6] truncate">
                XStreaming 2.12.0
              </div>
              <div className="text-[11px] font-mono text-[#9CA3AF] whitespace-nowrap">
                PORT ANDROID 7.0 · API 24
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#9CA3AF]">
            <a
              href="#resumen"
              className="whitespace-nowrap hover:text-[#F3F4F6] transition-colors">
              Resumen
            </a>
            <a
              href="#asus-p008"
              className="whitespace-nowrap hover:text-[#F3F4F6] transition-colors">
              ASUS P008
            </a>
            <a
              href="#auditoria"
              className="whitespace-nowrap hover:text-[#F3F4F6] transition-colors">
              Auditoría Técnica
            </a>
            <a
              href="#compilacion"
              className="whitespace-nowrap hover:text-[#F3F4F6] transition-colors">
              Compilar APK
            </a>
          </nav>

          <a
            href={ZIP_METADATA.downloadPath}
            download={ZIP_METADATA.filename}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#10B981] hover:bg-[#059669] text-[#052E16] font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors">
            <Download className="w-4 h-4" />
            <span>Descargar ZIP ({ZIP_METADATA.sizeHuman})</span>
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Zone 1: Overview & Verified Download Workbench */}
        <section id="resumen" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#10B981]">
                01 / PROYECTO FUENTE ADAPTADO · AGPL-3.0
              </span>
              <a
                href={ZIP_METADATA.upstreamRepo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">
                <span>Upstream: Geocld/XStreaming v2.12.0</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F4F6]">
                XStreaming 2.12.0 adaptado para Android 7.0 (API 24)
              </h1>
              <p className="text-sm sm:text-base text-[#9CA3AF] leading-relaxed">
                Código fuente íntegro de XStreaming 2.12.0 modificado para compilar desde{' '}
                <code className="text-[#F3F4F6] bg-[#0B0F17] px-1.5 py-0.5 rounded border border-[#1E293B]">
                  minSdkVersion 24
                </code>{' '}
                conservando React Native 0.72.14, Hermes, WebRTC 124.0.5, WebView 13.10.5, SDL2,
                motor Native C++ y módulo Rust <code className="text-[#F3F4F6]">nano-rs</code>.
              </p>
            </div>

            {/* 4 Key Telemetry KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">minSdk / target</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-[#10B981]">
                  24 / 34
                </div>
              </div>
              <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">Archivos editados</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-[#F3F4F6]">
                  23
                </div>
              </div>
              <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">Parches RN</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-[#F3F4F6]">
                  5 / 5
                </div>
              </div>
              <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">TypeScript / ZIP</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-[#10B981]">
                  OK
                </div>
              </div>
            </div>

            {/* Honest Verification Boundary Notice */}
            <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F59E0B]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Alcance de verificación en este entorno</span>
              </div>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                Verificado localmente: aplicación limpia de los 5 parches de{' '}
                <code className="text-[#F3F4F6]">patch-package</code>, compilación TypeScript (
                <code className="text-[#F3F4F6]">tsc --noEmit</code> sin errores), ESLint en
                pantallas modificadas, resolución de <code className="text-[#F3F4F6]">yarn.lock</code>{' '}
                y prueba de integridad del archivo ZIP (<code className="text-[#F3F4F6]">unzip -tq</code>).
                Este contenedor web no incluye Android SDK/NDK ni Cargo para compilar el binario{' '}
                <code className="text-[#F3F4F6]">.apk</code> directamente, por lo que el paquete
                incorpora el flujo automático{' '}
                <code className="text-[#F3F4F6]">.github/workflows/android-build.yml</code> listo
                para generar el APK instalable en GitHub Actions o en tu equipo local.
              </p>
            </div>
          </div>

          {/* Right Panel: Direct ZIP Download & Checksum */}
          <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#10B981]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#F3F4F6]">
                  Paquete fuente listo para compilar
                </span>
              </div>
              <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                {ZIP_METADATA.fileCount} archivos
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#6B7280] font-mono uppercase">Archivo</div>
                <div className="mt-1 font-mono text-sm text-[#F3F4F6] break-all">
                  {ZIP_METADATA.filename}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3">
                  <div className="text-[11px] font-mono text-[#6B7280] uppercase">Tamaño</div>
                  <div className="mt-1 font-mono text-sm text-[#F3F4F6] tabular-nums">
                    {ZIP_METADATA.sizeHuman}
                  </div>
                  <div className="font-mono text-[11px] text-[#6B7280] tabular-nums">
                    {ZIP_METADATA.sizeBytes.toLocaleString('es-ES')} bytes
                  </div>
                </div>
                <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3">
                  <div className="text-[11px] font-mono text-[#6B7280] uppercase">Exclusiones</div>
                  <div className="mt-1 font-mono text-xs text-[#9CA3AF]">
                    Sin node_modules, .git, build/ ni caché Gradle
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F17] border border-[#1E293B] rounded p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#6B7280] uppercase">SHA-256</span>
                  <button
                    type="button"
                    onClick={() => copyText('sha256', ZIP_METADATA.sha256)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#10B981] hover:text-[#34D399] cursor-pointer">
                    {copiedId === 'sha256' ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar hash</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-[#9CA3AF] break-all select-all">
                  {ZIP_METADATA.sha256}
                </div>
              </div>
            </div>

            <a
              href={ZIP_METADATA.downloadPath}
              download={ZIP_METADATA.filename}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded bg-[#10B981] hover:bg-[#059669] text-[#052E16] font-semibold text-sm transition-colors">
              <Download className="w-4 h-4" />
              <span>Descargar {ZIP_METADATA.filename}</span>
            </a>

            <p className="text-xs text-[#6B7280] leading-relaxed">
              Incluye atribuciones originales de <strong className="text-[#9CA3AF]">Geocld</strong>{' '}
              y licencia <strong className="text-[#9CA3AF]">AGPL-3.0</strong> sin modificar.
            </p>
          </div>
        </section>

        {/* Zone 2: Target Hardware ASUS P008 */}
        <section
          id="asus-p008"
          className="bg-[#111827] border border-[#1E293B] rounded p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1E293B] pb-4">
            <div className="flex items-center gap-2.5">
              <Tablet className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg sm:text-xl font-semibold text-[#F3F4F6]">
                Perfil de dispositivo: ASUS P008 (VZW_P008)
              </h2>
            </div>
            <span className="font-mono text-xs text-[#9CA3AF]">
              Snapdragon 650 · Adreno 510 · 2 GB RAM · API 24
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEVICE_PROFILE.map(spec => (
                <div
                  key={spec.label}
                  className="bg-[#0B0F17] border border-[#1E293B] rounded p-3.5">
                  <div className="text-[11px] font-mono uppercase text-[#6B7280]">
                    {spec.label}
                  </div>
                  <div className="mt-1 text-sm font-medium text-[#F3F4F6]">{spec.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0B0F17] border border-[#1E293B] rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#F3F4F6]">
                  Ajustes recomendados en XStreaming para esta tablet
                </span>
              </div>
              <div className="divide-y divide-[#1E293B]">
                {RECOMMENDED_PRESETS.map(preset => (
                  <div key={preset.setting} className="p-3.5 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-[#F3F4F6]">
                        {preset.setting}
                      </span>
                      <span className="font-mono text-xs text-[#10B981]">{preset.value}</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{preset.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Zone 3: Technical Audit Matrix */}
        <section
          id="auditoria"
          className="bg-[#111827] border border-[#1E293B] rounded overflow-hidden">
          <div className="p-6 border-b border-[#1E293B] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-[#10B981]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#F3F4F6]">
                    Auditoría técnica de archivos adaptados
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9CA3AF]">
                    Aislamiento de clases para verificador ART de Android 7.0, capa JNI/NDK C++ y
                    parches de compilación.
                  </p>
                </div>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filtrar archivo o API..."
                  className="w-full bg-[#0B0F17] border border-[#1E293B] focus:border-[#10B981] rounded pl-9 pr-3 py-2 text-sm text-[#F3F4F6] placeholder-[#6B7280] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map(tab => {
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer border ${
                      active
                        ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                        : 'bg-[#0B0F17] border-[#1E293B] text-[#9CA3AF] hover:text-[#F3F4F6]'
                    }`}>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0B0F17] text-[11px] font-mono uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4 min-w-[240px]">Archivo</th>
                  <th className="py-3 px-4 w-36">Capa</th>
                  <th className="py-3 px-4 min-w-[240px]">Incompatibilidad API 24</th>
                  <th className="py-3 px-4 min-w-[280px]">Adaptación implementada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] text-sm">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-[#0B0F17]/60 transition-colors align-top">
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6B7280] tabular-nums">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#F3F4F6] break-all">
                      <div className="flex items-start gap-2">
                        <FileCode2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{item.file}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-[#0B0F17] border border-[#1E293B] text-[#9CA3AF] whitespace-nowrap">
                        {item.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                      {item.blocker}
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                      {item.adaptation}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-[#6B7280]">
                      Ningún archivo coincide con el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Zone 4: Compilation & ASUS P008 Installation Guide */}
        <section
          id="compilacion"
          className="bg-[#111827] border border-[#1E293B] rounded overflow-hidden">
          <div className="p-6 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-[#10B981]" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#F3F4F6]">
                  Compilación del APK e instalación en ASUS P008
                </h2>
                <p className="text-xs sm:text-sm text-[#9CA3AF]">
                  Elige compilación automática en GitHub Actions (sin instalar NDK/Rust en tu PC)
                  o compilación local con Gradle.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBuildTab('github')}
                className={`px-3 py-1.5 rounded text-xs font-mono border cursor-pointer transition-colors ${
                  buildTab === 'github'
                    ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                    : 'bg-[#0B0F17] border-[#1E293B] text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}>
                GitHub Actions (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setBuildTab('local')}
                className={`px-3 py-1.5 rounded text-xs font-mono border cursor-pointer transition-colors ${
                  buildTab === 'local'
                    ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                    : 'bg-[#0B0F17] border-[#1E293B] text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}>
                Compilación Local
              </button>
              <button
                type="button"
                onClick={() => setBuildTab('asus')}
                className={`px-3 py-1.5 rounded text-xs font-mono border cursor-pointer transition-colors ${
                  buildTab === 'asus'
                    ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                    : 'bg-[#0B0F17] border-[#1E293B] text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}>
                Instalar en Tablet (ADB)
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {buildTab === 'github' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-3 text-sm text-[#9CA3AF] leading-relaxed">
                  <div className="flex items-center gap-2 text-[#F3F4F6] font-medium">
                    <FolderGit2 className="w-4 h-4 text-[#10B981]" />
                    <span>Pasos para subir a tu repositorio y obtener el APK</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm">
                    <li>
                      Descarga <code className="text-[#F3F4F6]">{ZIP_METADATA.filename}</code> y
                      descomprímelo en tu equipo.
                    </li>
                    <li>
                      Crea un repositorio vacío en tu cuenta de GitHub y sube el contenido de la
                      carpeta <code className="text-[#F3F4F6]">xstreaming-android7</code> usando los
                      comandos de la derecha.
                    </li>
                    <li>
                      En GitHub abre la pestaña <strong className="text-[#F3F4F6]">Actions</strong>{' '}
                      → selecciona{' '}
                      <strong className="text-[#F3F4F6]">
                        Build XStreaming Android 7.0 (API 24) APK
                      </strong>
                      .
                    </li>
                    <li>
                      Pulsa <strong className="text-[#F3F4F6]">Run workflow</strong>, elige{' '}
                      <code className="text-[#F3F4F6]">prodRelease</code> y en{' '}
                      <code className="text-[#F3F4F6]">abis</code> escribe{' '}
                      <code className="text-[#10B981]">arm64-v8a</code> para generar un APK más
                      ligero específico para tu ASUS P008 (o deja{' '}
                      <code className="text-[#F3F4F6]">armeabi-v7a,arm64-v8a</code> universal).
                    </li>
                    <li>
                      Al finalizar (~12–18 min), descarga el artefacto{' '}
                      <code className="text-[#F3F4F6]">XStreaming-2.12.0-android7-api24-apk</code>{' '}
                      con el archivo <code className="text-[#F3F4F6]">.apk</code>.
                    </li>
                  </ol>
                </div>

                <div className="lg:col-span-6 bg-[#0B0F17] border border-[#1E293B] rounded overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#6B7280]">bash · subir a GitHub</span>
                    <button
                      type="button"
                      onClick={() => copyText('git', gitPushScript)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#10B981] hover:text-[#34D399] cursor-pointer">
                      {copiedId === 'git' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'git' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#D1D5DB] overflow-x-auto leading-relaxed">
                    {gitPushScript}
                  </pre>
                </div>
              </div>
            )}

            {buildTab === 'local' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-3 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                  <p className="text-[#F3F4F6] font-medium">Requisitos en Linux / macOS / Windows:</p>
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>Node.js 18 o 20 con Corepack activo (Yarn 4.2.2)</li>
                    <li>JDK 17 (Temurin / OpenJDK 17)</li>
                    <li>Android SDK Platform 34, Build-Tools 34.0.0, NDK 23.1.7779620 y CMake 3.22.1</li>
                    <li>
                      Rust toolchain (<code className="text-[#F3F4F6]">rustup target add aarch64-linux-android armv7-linux-androideabi</code>)
                    </li>
                  </ul>
                  <p>
                    Si no existe un keystore privado propio, <code className="text-[#F3F4F6]">build.gradle</code>{' '}
                    utiliza automáticamente <code className="text-[#F3F4F6]">debug.keystore</code> para
                    que el APK sea instalable de inmediato.
                  </p>
                </div>

                <div className="lg:col-span-6 bg-[#0B0F17] border border-[#1E293B] rounded overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#6B7280]">bash · Gradle Release</span>
                    <button
                      type="button"
                      onClick={() => copyText('local', localBuildScript)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#10B981] hover:text-[#34D399] cursor-pointer">
                      {copiedId === 'local' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'local' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#D1D5DB] overflow-x-auto leading-relaxed">
                    {localBuildScript}
                  </pre>
                </div>
              </div>
            )}

            {buildTab === 'asus' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-3 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                  <p className="text-[#F3F4F6] font-medium">
                    Instalación manual en ASUS P008 (Android 7.0)
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>
                      En la tablet ve a <strong className="text-[#F3F4F6]">Ajustes → Seguridad</strong>{' '}
                      y activa <strong className="text-[#F3F4F6]">Orígenes desconocidos</strong>.
                    </li>
                    <li>
                      Asegúrate de tener Google Chrome actualizado desde Play Store o APK compatible
                      con Android 7.0 (el módulo <code className="text-[#F3F4F6]">FullScreenManager</code>{' '}
                      detectará Chrome automáticamente como WebView para login Microsoft).
                    </li>
                    <li>
                      Copia el APK generado a la tablet o instálalo por USB con el comando ADB de la
                      derecha.
                    </li>
                    <li>
                      Conecta tu GameSir Nova Lite por Bluetooth o cable OTG antes o durante la
                      sesión y usa el motor <strong className="text-[#F3F4F6]">Native</strong>.
                    </li>
                  </ol>
                </div>

                <div className="lg:col-span-6 bg-[#0B0F17] border border-[#1E293B] rounded overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#6B7280]">bash · adb install</span>
                    <button
                      type="button"
                      onClick={() => copyText('adb', adbInstallScript)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#10B981] hover:text-[#34D399] cursor-pointer">
                      {copiedId === 'adb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'adb' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#D1D5DB] overflow-x-auto leading-relaxed">
                    {adbInstallScript}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1E293B] bg-[#0B0F17] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div>
            Basado en XStreaming v2.12.0 por Geocld · Licencia AGPL-3.0 conservada en el paquete fuente.
          </div>
          <div className="font-mono">minSdkVersion 24 · ASUS P008 (ARM64)</div>
        </div>
      </footer>
    </div>
  );
}
