/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { NBEAlertStrip } from './components/NBEAlertStrip';
import { ArticleCard } from './components/ArticleCard';
import { EthiopiaPriorityLane } from './components/EthiopiaPriorityLane';
import { OwnBrandPanel } from './components/OwnBrandPanel';
import { MatrixHeatmapView } from './components/MatrixHeatmapView';
import { ArchiveFilterView } from './components/ArchiveFilterView';
import { SourceHealthView } from './components/SourceHealthView';
import { BriefingView } from './components/BriefingView';
import { CachedCopyModal } from './components/CachedCopyModal';
import { StoredArticle, StoredSource } from './server/db';
import { SupportedLanguage, TRANSLATIONS } from './i18n/translations';
import { THEMES, LEGACY_THEME_MAP, THEME_BY_ID, ThemeId } from './themes';
import { usePause } from './components/SourceHealthToggle';
import { AlertCircle, RefreshCw, CheckCircle2, Radio, Filter, Clock } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const t = TRANSLATIONS[language];
  const { isPaused, getPausedIds } = usePause();

  const [activeTab, setActiveTab] = useState<
    'stream' | 'ethiopia' | 'own_brand' | 'matrix' | 'archive' | 'sources' | 'briefing'
  >('stream');

  // Backend data state
  const [articles, setArticles] = useState<StoredArticle[]>([]);
  const [alerts, setAlerts] = useState<StoredArticle[]>([]);
  const [ownBrandItems, setOwnBrandItems] = useState<StoredArticle[]>([]);
  const [sources, setSources] = useState<StoredSource[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [suggestedSources, setSuggestedSources] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cachedCopyArticle, setCachedCopyArticle] = useState<StoredArticle | null>(null);

  // Quick stream filter
  const [streamFilterGroup, setStreamFilterGroup] = useState<string>('ALL');
  const [streamFilterCategory, setStreamFilterCategory] = useState<string>('ALL');
  const [streamFilterTag, setStreamFilterTag] = useState<string>('ALL');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch all live dashboard data from persistent backend
  const loadDashboardData = useCallback(async () => {
    try {
      const [statusRes, articlesRes, alertsRes, ownBrandRes, sourcesRes, suggestedRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()).catch(() => null),
        fetch('/api/articles?status=active').then((r) => r.json()).catch(() => ({ articles: [] })),
        fetch('/api/alerts').then((r) => r.json()).catch(() => ({ alerts: [] })),
        fetch('/api/own-brand').then((r) => r.json()).catch(() => ({ items: [] })),
        fetch('/api/sources').then((r) => r.json()).catch(() => ({ sources: [], recentLogs: [] })),
        fetch('/api/suggested-sources').then((r) => r.json()).catch(() => ({ suggested: [] })),
      ]);

      if (statusRes) {
        setTelemetry(statusRes);
        if (statusRes.lastSyncStatus === 'failed') {
          setSyncError(statusRes.lastSyncError || 'Feeds sync failed');
        } else {
          setSyncError(null);
        }
      }

      setArticles(articlesRes?.articles || []);
      setAlerts(alertsRes?.alerts || []);
      setOwnBrandItems(ownBrandRes?.items || []);
      setSources(sourcesRes?.sources || []);
      setRecentLogs(sourcesRes?.recentLogs || []);
      setSuggestedSources(suggestedRes?.suggested || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setSyncError('Could not reach backend surveillance service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real backend sync trigger
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const pausedIds = getPausedIds();
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: 'ALL', pausedIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Sync complete: Polled ${data.sourcesPolled} feeds · ${data.newArticles} new items ingested`);
        await loadDashboardData();
      } else {
        setSyncError(data.error || 'Ingestion encountered an issue');
      }
    } catch (err: any) {
      setSyncError(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Poll single source (guard against paused feeds)
  const handlePollSingleSource = async (sourceId: string) => {
    if (isPaused(sourceId)) {
      showToast('Source is currently paused. Resume it to poll.');
      return;
    }
    try {
      const res = await fetch(`/api/sync/source/${sourceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: false }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Polled source: ${data.found} items found, ${data.newCount} new`);
        await loadDashboardData();
      } else {
        showToast(`Poll failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      showToast(`Poll failed: ${err.message}`);
    }
  };

  // Enable extra source
  const handleEnableSuggestedSource = async (name: string, url: string) => {
    try {
      const res = await fetch('/api/suggested-sources/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Source confirmed & enabled: ${name}`);
        await loadDashboardData();
      }
    } catch (err: any) {
      showToast(`Failed to enable source: ${err.message}`);
    }
  };

  // Article actions: Star, Archive, Review
  const handleArticleAction = async (id: string, action: 'star' | 'archive' | 'review') => {
    try {
      const res = await fetch(`/api/article/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) =>
          prev
            .map((a) => (a.id === id ? { ...a, status: data.status } : a))
            .filter((a) => (action === 'archive' ? a.id !== id : true))
        );
        showToast(`Article ${action === 'star' ? 'prioritized' : action === 'archive' ? 'archived' : 'reviewed'}`);
      }
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  // Filter stream
  const filteredStreamArticles = articles.filter((a) => {
    if (streamFilterGroup !== 'ALL' && a.source_group !== streamFilterGroup) return false;
    if (streamFilterCategory !== 'ALL' && a.category !== streamFilterCategory) return false;
    if (streamFilterTag !== 'ALL') {
      const legacyTag = Object.entries(LEGACY_THEME_MAP).find(([_, v]) => v === streamFilterTag)?.[0];
      const hasMatch = a.tags.includes(streamFilterTag) || (legacyTag && a.tags.includes(legacyTag));
      if (!hasMatch) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 flex flex-col font-sans">
      {/* Top Bar with real Telemetry & Trilingual Switcher */}
      <TopNav
        telemetry={telemetry}
        activeTab={activeTab}
        language={language}
        onSelectLanguage={setLanguage}
        onSelectTab={setActiveTab}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
      />

      {/* PINNED REGULATORY STRIP: NBE directives and ECMA notices */}
      <NBEAlertStrip
        alerts={alerts}
        language={language}
        onAction={handleArticleAction}
        onViewCachedCopy={setCachedCopyArticle}
      />

      {/* Ingestion Error Banner */}
      {syncError && (
        <div className="bg-red-950/80 border-b border-red-600/60 px-4 py-2.5 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">Ingestion Alert:</span>
            <span>{syncError}</span>
          </div>
          {telemetry?.lastSyncTime && (
            <span className="text-[11px] font-mono text-red-300">
              {t.lastSync}: {telemetry.lastSyncTime.replace('T', ' ').slice(0, 19)} UTC
            </span>
          )}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-32 text-center">
            <div className="inline-block w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-base font-bold text-white">Connecting to Awash Bank Intelligence Engine...</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Validating stored article hashes and checking source endpoints...
            </p>
          </div>
        ) : (
          <>
            {/* View 1: Active Radar Stream */}
            {activeTab === 'stream' && (
              <div className="space-y-5">
                {/* Stream Sub-filter Bar (Previous Categorization) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1226] p-3 rounded-xl border border-[#17254a]">
                  <div className="flex items-center gap-2 text-xs">
                    <Radio className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-bold text-white">{t.activeRadar}</span>
                    <span className="text-slate-400">({filteredStreamArticles.length} items)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium text-[11px]">{t.filterByCategory}:</span>
                      <select
                        value={streamFilterCategory}
                        onChange={(e) => setStreamFilterCategory(e.target.value)}
                        className="px-2 py-1 bg-[#060b18] border border-[#1b2b52] rounded-md text-[11px] text-white font-medium"
                      >
                        <option value="ALL">{t.allCategories}</option>
                        <option value="Product/Service Launch">{t.categories.productLaunch}</option>
                        <option value="Partnership">{t.categories.partnership}</option>
                        <option value="Technology Acquisition / Platform Deal">{t.categories.techAcquisition}</option>
                        <option value="Business Process Modernization / Automation">{t.categories.processAutomation}</option>
                        <option value="Transformation Initiative / Strategy Announcement">{t.categories.transformation}</option>
                        <option value="Funding / Valuation Signal">{t.categories.funding}</option>
                      </select>
                    </div>

                    {/* Theme Filter (22 Modernization Themes) */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium text-[11px]">{t.filterByTag}:</span>
                      <select
                        value={streamFilterTag}
                        onChange={(e) => setStreamFilterTag(e.target.value)}
                        className="px-2 py-1 bg-[#060b18] border border-[#1b2b52] rounded-md text-[11px] text-white font-medium max-w-[200px]"
                      >
                        <option value="ALL">{t.allThemes}</option>
                        {Array.from(new Set(THEMES.map((th) => th.cluster))).map((cluster) => (
                          <optgroup key={cluster} label={cluster}>
                            {THEMES.filter((th) => th.cluster === cluster).map((th) => (
                              <option key={th.id} value={th.id}>
                                {th.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Group Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium text-[11px]">{t.filterByGroup}:</span>
                      <select
                        value={streamFilterGroup}
                        onChange={(e) => setStreamFilterGroup(e.target.value)}
                        className="px-2 py-1 bg-[#060b18] border border-[#1b2b52] rounded-md text-[11px] text-white font-mono"
                      >
                        <option value="ALL">{t.allGroups}</option>
                        <option value="P1_ETHIOPIA_MEDIA_REG">P1 Ethiopia Media & Reg</option>
                        <option value="P1_ETHIOPIAN_BANKS">P1 Ethiopian Banks</option>
                        <option value="OWN_BRAND">Own Brand (Awash)</option>
                        <option value="P2_FINTECH_MEDIA">P2 Global Fintech Media</option>
                        <option value="P2_AFRICA_MEDIA">P2 Africa Media</option>
                        <option value="P3_AFRICAN_PEER_BANKS">P3 African Peer Banks</option>
                        <option value="P3_GSIB">P3 Global Systemic Banks</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredStreamArticles.length === 0 ? (
                  <div className="p-16 text-center rounded-xl bg-[#0b1328] border border-[#1b2b52]">
                    <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white mb-1">{t.noArticlesFound}</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                      All displayed items must be actually fetched from publisher feeds with working URLs and publication dates. Click "Sync Now" to poll registered Ethiopian and global banking sources.
                    </p>
                    <button
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? t.syncing : t.syncNow}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStreamArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        language={language}
                        onAction={handleArticleAction}
                        onViewCachedCopy={setCachedCopyArticle}
                        onFilterByTag={(tag) => setStreamFilterTag(tag === streamFilterTag ? 'ALL' : tag)}
                        onFilterByCategory={(cat) => setStreamFilterCategory(cat)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View 2: Ethiopia Priority Lane */}
            {activeTab === 'ethiopia' && (
              <EthiopiaPriorityLane
                articles={articles}
                onAction={handleArticleAction}
                onViewCachedCopy={setCachedCopyArticle}
              />
            )}

            {/* View 3: Own Brand (Awash Bank) */}
            {activeTab === 'own_brand' && (
              <OwnBrandPanel
                items={ownBrandItems}
                onViewCachedCopy={setCachedCopyArticle}
              />
            )}

            {/* View 4: Category Matrix (Heatmap) */}
            {activeTab === 'matrix' && (
              <MatrixHeatmapView
                articles={articles}
                language={language}
                onAction={handleArticleAction}
                onViewCachedCopy={setCachedCopyArticle}
              />
            )}

            {/* View 5: Archive & Deep Search */}
            {activeTab === 'archive' && (
              <ArchiveFilterView
                articles={articles}
                sources={sources}
                onAction={handleArticleAction}
                onViewCachedCopy={setCachedCopyArticle}
              />
            )}

            {/* View 6: Source Health & Registry */}
            {activeTab === 'sources' && (
              <SourceHealthView
                sources={sources}
                recentLogs={recentLogs}
                suggestedSources={suggestedSources}
                onPollSource={handlePollSingleSource}
                onEnableSuggestedSource={handleEnableSuggestedSource}
              />
            )}

            {/* View 7: Executive Briefing Export */}
            {activeTab === 'briefing' && (
              <BriefingView onRefresh={loadDashboardData} />
            )}
          </>
        )}
      </main>

      {/* Cached Copy Snapshot Modal */}
      <CachedCopyModal
        article={cachedCopyArticle}
        onClose={() => setCachedCopyArticle(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#142347] border border-orange-500/60 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
