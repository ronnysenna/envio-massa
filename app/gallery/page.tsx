"use client";

import { Check, Copy, Download, Eye } from "lucide-react";
import { useEffect, useState } from "react";

interface GalleryImage {
  id: number;
  url: string;
  filename: string;
  createdAt?: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/images");
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
        }
      } catch (error) {
        console.error("Erro ao carregar imagens:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-slate-400 mt-4">Carregando galeria...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            Galeria de Imagens
          </h1>
          <p className="text-slate-400 text-lg">
            {images.length} imagens disponíveis para download
          </p>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-xl">Nenhuma imagem disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {/* Image */}
                <div className="relative w-full aspect-square bg-slate-700 overflow-hidden group">
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      try {
                        (e.currentTarget as HTMLImageElement).src = "/file.svg";
                      } catch {}
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(img.url)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      title="Visualizar em tamanho real"
                    >
                      <Eye size={24} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-slate-300 text-sm font-medium truncate mb-2">
                    {img.filename}
                  </p>
                  <p className="text-slate-500 text-xs mb-3">
                    {img.createdAt
                      ? new Date(img.createdAt).toLocaleDateString("pt-BR")
                      : "Data desconhecida"}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadImage(img.url, img.filename)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(img.url)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                      title="Copiar URL"
                    >
                      {copiedUrl === img.url ? (
                        <>
                          <Check size={14} />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          URL
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {selectedImage && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelectedImage(null);
            }}
          >
            <div
              role="document"
              className="relative max-w-4xl max-h-[80vh] w-full bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full transition-colors"
              >
                ✕
              </button>
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedImage || ""}
                  alt="Preview"
                  className="max-h-[80vh] max-w-full object-contain"
                  onError={(e) => {
                    try {
                      (e.currentTarget as HTMLImageElement).src = "/file.svg";
                    } catch {}
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
