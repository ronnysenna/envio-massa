"use client";

import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { imageToBase64 } from "@/lib/fileUtils";

export default function ImagemPage() {
  const toast = useToast();
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [images, setImages] = useState<
    Array<{
      id: number;
      url: string;
      filename: string;
      createdAt?: string;
      userId?: number;
    }>
  >([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // carregar imagens públicas do servidor
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/images");
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
        }
      } catch (_err) {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({
        type: "error",
        message: "Por favor, selecione um arquivo de imagem válido.",
      });
      toast.showToast({
        type: "error",
        message: "Arquivo selecionado não é uma imagem.",
      });
      return;
    }

    setImageFile(file);
    const base64 = await imageToBase64(file);
    setImagePreview(base64);
    setStatus({ type: "success", message: "Imagem pronta para upload." });
  };

  const handleUpload = async () => {
    if (!imageFile) {
      toast.showToast({
        type: "error",
        message: "Selecione uma imagem antes de enviar.",
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.showToast({
          type: "error",
          message: data.error || "Falha no upload",
        });
        setStatus({ type: "error", message: data.error || "Falha no upload" });
      } else {
        setUploadedUrl(data.url);
        toast.showToast({
          type: "success",
          message: "Imagem enviada com sucesso.",
        });
        setStatus({ type: "success", message: "Upload concluído." });
        // adicionar à galeria localmente para feedback imediato
        setImages((s) => [
          {
            id: Date.now(),
            url: data.url,
            filename: imageFile.name,
            createdAt: new Date().toISOString(),
          },
          ...s,
        ]);
        // limpar preview após envio bem-sucedido
        setTimeout(() => {
          setImageFile(null);
          setImagePreview(null);
          setUploadedUrl(null);
        }, 1500);
      }
    } catch (err) {
      console.error("upload error", err);
      toast.showToast({
        type: "error",
        message: "Erro no upload. Tente novamente.",
      });
      setStatus({ type: "error", message: "Erro no upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Confirma excluir esta imagem?")) return;
    try {
      const res = await fetch(`/api/images/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        toast.showToast({
          type: "error",
          message: "Sessão expirada. Faça login novamente.",
        });
        router.push("/login");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showToast({
          type: "error",
          message: data.error || "Falha ao excluir imagem.",
        });
        return;
      }
      setImages((s) => s.filter((x) => x.id !== id));
      toast.showToast({ type: "success", message: "Imagem excluída." });
    } catch (err) {
      console.error("delete image error", err);
      toast.showToast({ type: "error", message: "Erro ao excluir imagem." });
    }
  };

  const handleSelectForSend = (url: string) => {
    try {
      localStorage.setItem("selectedImageUrl", url);
    } catch {}
    toast.showToast({
      type: "success",
      message: "Imagem selecionada para envio.",
    });
  };

  // abrir preview em modal
  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };
  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewUrl(null);
  }, []);

  // ESC para fechar preview
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen, closePreview]);

  return (
    <main className="flex-1 p-8 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload de Imagem (público)
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          A galeria abaixo exibe as imagens salvas no banco. O upload ainda
          requer autenticação.
        </p>

        <div className="card max-w-lg mb-6">
          <div className="p-6">
            <label
              htmlFor="image-upload"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Selecione uma imagem para upload
            </label>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition text-center">
                <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-gray-700 font-semibold mb-1">
                  Clique para selecionar imagem
                </p>
                <p className="text-sm text-gray-500">PNG, JPG ou GIF</p>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>

            {status.type && (
              <div
                className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${status.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                {status.type === "success" ? (
                  <CheckCircle className="text-green-600 shrink-0" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 shrink-0" size={20} />
                )}
                <p
                  className={`text-sm ${status.type === "success" ? "text-green-800" : "text-red-800"}`}
                >
                  {status.message}
                </p>
              </div>
            )}

            {imagePreview && (
              <div className="mt-6">
                <div className="mb-2 text-gray-700 font-semibold flex items-center gap-2">
                  <ImageIcon size={20} /> Preview da Imagem
                </div>
                <div className="relative max-w-full aspect-square bg-white p-2 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden">
                  <img
                    src={imagePreview || ""}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      try {
                        (e.currentTarget as HTMLImageElement).src = "/file.svg";
                      } catch {}
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setUploadedUrl(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remover imagem
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {uploading ? "Enviando..." : "Enviar imagem"}
                  </button>
                </div>
                {uploadedUrl && (
                  <div className="mt-3 text-xs text-gray-600">
                    URL:{" "}
                    <a
                      className="text-blue-600"
                      href={uploadedUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {uploadedUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Galeria pública de imagens em miniaturas */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Galeria de imagens
          </h2>
          {images.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhuma imagem encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
                >
                  <button
                    type="button"
                    onClick={() => openPreview(img.url)}
                    className="block w-full aspect-square bg-gray-100 dark:bg-gray-900 hover:opacity-80 transition overflow-hidden group relative"
                  >
                    <img
                      src={encodeURI(img.url)}
                      alt={img.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        try {
                          (e.currentTarget as HTMLImageElement).src =
                            "/file.svg";
                        } catch {}
                      }}
                    />
                  </button>
                  <div className="p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2 font-medium">
                      {img.filename}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectForSend(img.url)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-1"
                      >
                        Selecionar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(img.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de preview */}
          {previewOpen && previewUrl && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={closePreview}
            >
              <div
                role="document"
                tabIndex={-1}
                className="max-w-[90vw] max-h-[90vh] p-4"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <div className="relative bg-white rounded shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={closePreview}
                    aria-label="Fechar"
                    className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow"
                  >
                    ✕
                  </button>
                  <div className="relative w-[80vw] h-[80vh] md:w-[60vw] md:h-[60vh] bg-black flex items-center justify-center">
                    <img
                      src={encodeURI(previewUrl || "")}
                      alt="Preview grande"
                      className="max-h-[80vh] max-w-full object-contain"
                      onError={(e) => {
                        try {
                          (e.currentTarget as HTMLImageElement).src =
                            "/file.svg";
                        } catch {}
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
