'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type JobStatus = {
  id: number;
  status: string;
  prospectsFound?: number;
  prospectsNew?: number;
  error?: string;
};

type FilterPreview = {
  title: string;
  keywordsCompany?: string;
  search?: string;
  location?: string;
};

function buildFilterPreview(
  titles: string[],
  sectors: string[],
  companyProfile: string[],
  companies: string[],
  locations: string[],
): FilterPreview {
  const title = titles.join(', ');
  const keywordsCompany = [...sectors, ...companies].filter(Boolean).join(', ');
  const search = companyProfile.length > 0 ? companyProfile.join(' ') : undefined;
  const location = locations.length > 0 ? locations.join(', ') : undefined;

  return {
    title,
    ...(keywordsCompany && { keywordsCompany }),
    ...(search && { search }),
    ...(location && { location }),
  };
}

export default function SettingsPage() {
  const [titles, setTitles] = useState('CEO\nCFO\nCTO\nVP\nDiretor');
  const [sectors, setSectors] = useState('Manufacturing\nConsumer Products\nIndustrial');
  const [companyProfile, setCompanyProfile] = useState('innovation\ndesign\nR&D\nproduct portfolio');
  const [companies, setCompanies] = useState('');
  const [locations, setLocations] = useState('Brazil');
  const [maxResults, setMaxResults] = useState(25);
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseTextarea = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const filterPreview = useMemo(
    () =>
      buildFilterPreview(
        parseTextarea(titles),
        parseTextarea(sectors),
        parseTextarea(companyProfile),
        parseTextarea(companies),
        parseTextarea(locations),
      ),
    [titles, sectors, companyProfile, companies, locations],
  );

  async function handleScrape() {
    setLoading(true);
    setError(null);
    setJobStatus(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titles: parseTextarea(titles),
          sectors: parseTextarea(sectors),
          companyProfile: parseTextarea(companyProfile),
          companies: parseTextarea(companies),
          locations: parseTextarea(locations),
          maxResults,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Erro ao iniciar busca');
      }

      const { jobId } = await res.json();
      pollJobStatus(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }

  async function pollJobStatus(jobId: number) {
    const poll = async () => {
      try {
        const res = await fetch(`/api/scrape/${jobId}`);
        const job = await res.json();

        setJobStatus(job);

        if (job.status === 'running') {
          setTimeout(poll, 3000);
        } else {
          setLoading(false);
        }
      } catch {
        setError('Erro ao verificar status do job');
        setLoading(false);
      }
    };

    poll();
  }

  const canSubmit = parseTextarea(titles).length > 0 && parseTextarea(sectors).length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações de Busca</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Buscar Prospects no LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargos-alvo (um por linha) *
            </label>
            <textarea
              value={titles}
              onChange={(e) => setTitles(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="CEO&#10;CFO&#10;CTO&#10;VP&#10;Diretor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setores / Tipo de empresa (um por linha) *
            </label>
            <textarea
              value={sectors}
              onChange={(e) => setSectors(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="Manufacturing&#10;Consumer Products&#10;Industrial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perfil da empresa (um por linha)
            </label>
            <textarea
              value={companyProfile}
              onChange={(e) => setCompanyProfile(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="innovation&#10;design&#10;R&D&#10;product portfolio"
            />
            <p className="mt-1 text-xs text-gray-500">
              Palavras-chave que descrevem o perfil ideal (inovação, faturamento, portfolio, etc.)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresas específicas (um por linha)
            </label>
            <textarea
              value={companies}
              onChange={(e) => setCompanies(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="Opcional — deixe vazio para buscar por perfil"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localização (um por linha)
            </label>
            <textarea
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="Brazil&#10;São Paulo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máximo de resultados
            </label>
            <Input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              min={1}
              max={500}
              className="w-32"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Filtros que serão enviados ao LinkedIn
            </label>
            <div className="text-sm text-gray-800 font-mono break-words space-y-1">
              <p><span className="text-gray-500">Cargo atual:</span> {filterPreview.title || '(vazio)'}</p>
              {filterPreview.keywordsCompany && (
                <p><span className="text-gray-500">Empresa/Setor:</span> {filterPreview.keywordsCompany}</p>
              )}
              {filterPreview.search && (
                <p><span className="text-gray-500">Perfil:</span> {filterPreview.search}</p>
              )}
              {filterPreview.location && (
                <p><span className="text-gray-500">Local:</span> {filterPreview.location}</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleScrape}
            disabled={loading || !canSubmit}
            className="bg-[#1e3a5f] hover:bg-[#2a4f7f] text-white"
          >
            {loading ? 'Buscando...' : 'Buscar Prospects'}
          </Button>

          {loading && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="h-4 w-4 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[#1e3a5f]">
                Buscando prospects no LinkedIn... isso pode levar alguns minutos.
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {jobStatus && jobStatus.status === 'completed' && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
              Busca concluída! {jobStatus.prospectsFound} prospects encontrados,{' '}
              {jobStatus.prospectsNew} novos adicionados.
            </div>
          )}

          {jobStatus && jobStatus.status === 'failed' && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              Busca falhou: {jobStatus.error || 'Erro desconhecido'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
