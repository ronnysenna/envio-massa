"use client";

import { useEffect, useState } from "react";

export default function DashboardMetrics() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function fetchMetrics() {
            try {
                const res = await fetch("/api/dashboard/metrics");
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (err) {
                // ignore
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
        return () => { mounted = false; };
    }, []);

    if (loading) return <div>Carregando métricas...</div>;
    if (!metrics) return <div>Erro ao carregar métricas</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-(--muted) text-sm">Total de Contatos</p>
                        <p className="text-3xl font-bold text-(--text) mt-2">{metrics.contactsCount}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full">{/* icon */}</div>
                </div>
            </div>

            <div className="card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-(--muted) text-sm">Grupos</p>
                        <p className="text-3xl font-bold text-(--text) mt-2">{metrics.groupsCount}</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-full">{/* icon */}</div>
                </div>
            </div>

            <div className="card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-(--muted) text-sm">Imagens</p>
                        <p className="text-3xl font-bold text-(--text) mt-2">{metrics.imagesCount}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full">{/* icon */}</div>
                </div>
            </div>

            <div className="card p-6">
                <div>
                    <p className="text-(--muted) text-sm">Top grupos</p>
                    <ul className="mt-2 text-sm">
                        {metrics.topGroups.map((g: any) => (
                            <li key={g.id}>{g.nome} — {g.contacts} contatos</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
