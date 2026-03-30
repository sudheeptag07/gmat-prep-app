'use client';

import { useMemo, useState } from 'react';
import { fictionPlaces } from '@/lib/fiction-map-data';

const stats = [
  { label: 'Places in demo', value: `${fictionPlaces.length}` },
  {
    label: 'Books mapped',
    value: `${fictionPlaces.reduce((total, place) => total + place.books.length, 0)}`
  },
  { label: 'Coverage style', value: 'Curated sample' }
];

export function IndiaFictionExplorer() {
  const [selectedPlaceId, setSelectedPlaceId] = useState(fictionPlaces[0]?.id ?? '');

  const selectedPlace = useMemo(
    () => fictionPlaces.find((place) => place.id === selectedPlaceId) ?? fictionPlaces[0],
    [selectedPlaceId]
  );

  return (
    <section className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-[#d4dbc3] bg-[#f4f1e6] px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#6f672c]">
            Fiction by place
          </p>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[#13261a] md:text-7xl">
              Explore India through the novels and stories rooted in each place.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#5d6853]">
              Click a literary hotspot on the map and see books, authors, and short summaries for fiction associated with that region.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[28px] border border-[#d9decd] bg-white/90 p-5 shadow-[0_20px_40px_rgba(61,54,32,0.06)]"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-[#7c8669]">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#24341f]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-[#d6d2bf] bg-[linear-gradient(180deg,#faf7ef_0%,#efe7d5_100%)] p-6 shadow-[0_32px_80px_rgba(68,52,20,0.12)]">
          <div className="rounded-[30px] border border-[#ddd6bf] bg-[#fffdf8] p-4">
            <div className="flex items-center justify-between border-b border-[#ece5cf] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8c7b53]">
                  Interactive map
                </p>
                <p className="mt-1 text-xl font-semibold text-[#20301a]">India literary atlas</p>
              </div>
              <div className="rounded-full bg-[#edf0df] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d35]">
                Demo
              </div>
            </div>
            <IndiaMap selectedPlaceId={selectedPlace.id} onSelectPlace={setSelectedPlaceId} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <aside className="glass-panel p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#80886e]">Places</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#13261a]">Choose a region</h2>
            </div>
            <p className="text-sm text-[#69745f]">{fictionPlaces.length} hotspots</p>
          </div>
          <div className="mt-5 grid gap-3">
            {fictionPlaces.map((place) => {
              const active = place.id === selectedPlace.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setSelectedPlaceId(place.id)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    active
                      ? 'border-[#8d9f42] bg-[#eff2e1] shadow-[0_16px_32px_rgba(92,111,47,0.12)]'
                      : 'border-[#dde3d4] bg-[#fcfbf7] hover:border-[#bfca9f] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-[#223127]">{place.name}</p>
                      <p className="text-sm text-[#69745f]">{place.state}</p>
                    </div>
                    <div className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[#5f7130]">
                      {place.books.length}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="glass-panel overflow-hidden">
          <div className="border-b border-[#e2e5d7] bg-[linear-gradient(135deg,#1f331f_0%,#344720_55%,#7f5929_100%)] px-6 py-6 text-white">
            <p className="text-sm uppercase tracking-[0.22em] text-[#d9e6af]">{selectedPlace.state}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{selectedPlace.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#ebefdc]">
                  {selectedPlace.description}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-[#dfe9bc]">Books shown</p>
                <p className="mt-2 text-3xl font-semibold">{selectedPlace.books.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">
            {selectedPlace.books.map((book) => (
              <article
                key={`${selectedPlace.id}-${book.title}`}
                className="rounded-[28px] border border-[#dfe4d7] bg-[#fcfbf8] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-[#1e3020]">{book.title}</h3>
                    <p className="mt-1 text-sm font-medium uppercase tracking-[0.16em] text-[#7c6647]">
                      {book.author}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#eff2e4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#62762d]">
                    Fiction
                  </div>
                </div>
                <p className="mt-4 text-base leading-7 text-[#596551]">{book.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function IndiaMap({
  selectedPlaceId,
  onSelectPlace
}: {
  selectedPlaceId: string;
  onSelectPlace: (id: string) => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-[28px] border border-[#e8dfc8] bg-[linear-gradient(180deg,#f3e8cf_0%,#e4d3ae_100%)] p-4">
      <svg viewBox="0 0 340 360" className="h-auto w-full" role="img" aria-label="Stylized map of India with literary hotspots">
        <defs>
          <linearGradient id="indiaFill" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#61793a" />
            <stop offset="100%" stopColor="#3e5326" />
          </linearGradient>
        </defs>
        <path
          d="M134 26 162 34 181 58 211 72 237 92 251 120 281 147 299 178 295 211 277 238 264 262 246 279 232 304 214 330 187 320 176 295 163 276 146 259 131 239 116 221 105 196 95 165 109 144 127 123 136 93 132 64 134 26Z"
          fill="url(#indiaFill)"
          stroke="#f2e9d2"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M189 323 201 343 214 357"
          fill="none"
          stroke="#f2e9d2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M120 73 96 57 74 48 58 37"
          fill="none"
          stroke="#f2e9d2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="247" cy="86" r="12" fill="#f4efe3" opacity="0.35" />
        {fictionPlaces.map((place) => {
          const active = place.id === selectedPlaceId;

          return (
            <g key={place.id}>
              <circle
                cx={place.x}
                cy={place.y}
                r={active ? 13 : 9}
                fill={active ? '#d06f2d' : '#f8f4e6'}
                opacity={active ? 0.22 : 0.16}
              />
              <circle
                cx={place.x}
                cy={place.y}
                r={active ? 6 : 4}
                fill={active ? '#d06f2d' : '#8a9b44'}
                stroke="#fff8eb"
                strokeWidth="2"
              />
              <circle
                cx={place.x}
                cy={place.y}
                r="16"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelectPlace(place.id)}
              >
                <title>{place.name}</title>
              </circle>
            </g>
          );
        })}
      </svg>
      <p className="mt-3 text-sm leading-6 text-[#6c755a]">
        This map is a stylized prototype with curated hotspots. A production version would use state and city boundaries plus a much larger reviewed book catalog.
      </p>
    </div>
  );
}
