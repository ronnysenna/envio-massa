"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Upload,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { imageToBase64 } from "@/lib/fileUtils";
import { useToast } from "@/components/ToastProvider";

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
    const [images, setImages] = useState<Array<{ id: number; url: string; filename: string; createdAt: string; userId: number }>>([]);

    // carregar imagens públicas do servidor
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const res = await fetch('/api/images');
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
        return () => { mounted = false; };
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
            }
        } catch {
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
            const res = await fetch(`/api/images/${id}`, { method: "DELETE", credentials: "include" });
            if (res.status === 401) {
                toast.showToast({ type: "error", message: "Sessão expirada. Faça login novamente." });
                router.push("/login");
                return;
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.showToast({ type: "error", message: data.error || "Falha ao excluir imagem." });
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
        // salvar em localStorage para a página de envio recuperar
        try { localStorage.setItem('selectedImageUrl', url); } catch { }
        toast.showToast({ type: 'success', message: 'Imagem selecionada para envio.' });
    };

    return (
        <>
            <main className="flex-1 p-8 bg-transparent min-h-screen">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload de Imagem (público)</h1>
                    <p className="text-sm text-gray-600 mb-6">A galeria abaixo exibe as imagens salvas no banco. O upload ainda requer autenticação.</p>

                    <div className="card max-w-lg">
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
                                    className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${status.type === "success"
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-red-50 border border-red-200"
                                        }`}
                                >
                                    {status.type === "success" ? (
                                        <CheckCircle
                                            className="text-green-600 shrink-0"
                                            size={20}
                                        />
                                    ) : (
                                        <AlertCircle className="text-red-600 shrink-0" size={20} />
                                    )}
                                    <p
                                        className={`text-sm ${status.type === "success"
                                            ? "text-green-800"
                                            : "text-red-800"
                                            }`}
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
                                    <div className="relative w-64 h-64">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-contain rounded-lg border border-gray-300"
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

                    {/* Galeria pública de imagens salvas */}
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Galeria de imagens</h2>
                        {images.length === 0 ? (
                            <div className="text-sm text-gray-500">Nenhuma imagem encontrada.</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {images.map((img) => (
                                    <div key={img.id} className="block p-1 border rounded bg-(--panel)">
                                        <div className="relative w-full h-40 rounded overflow-hidden">
                                            <Image src={img.url} alt={img.filename} fill className="object-cover" />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="text-xs text-(--muted) truncate">{img.filename}</div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => handleSelectForSend(img.url)} className="text-sm text-blue-600 hover:underline">Selecionar</button>
                                                <button type="button" onClick={() => handleDelete(img.id)} className="text-sm text-red-600 hover:underline">Excluir</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
