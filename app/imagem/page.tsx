"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

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

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 bg-transparent min-h-screen">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        Upload de Imagem
                    </h1>

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
                </div>
            </main>
        </ProtectedRoute>
    );
}
