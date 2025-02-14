'use client';

import { useState } from 'react';
import { fetchFromAPI } from '../utils/communication';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            if (selectedFile) {
                setFile(selectedFile);
            }
        }
    };

    const uploadFile = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(0);

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('file', chunk);
            formData.append('filename', file.name);
            formData.append('chunkIndex', i.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('tags', tags);
            formData.append('private', isPrivate.toString());

            await fetchFromAPI('/sound/upload', {
                method: 'POST',
                body: formData,
            });

            setProgress(((i + 1) / totalChunks) * 100);
        }

        setUploading(false);
        alert('Upload complete');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white shadow-lg p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Upload File in Chunks</h2>
                <input type="file" onChange={handleFileChange} className="mb-4" />
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 p-2 w-full border rounded" />
                <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-2 p-2 w-full border rounded" />
                <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="mb-2 p-2 w-full border rounded" />
                <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="mb-2 p-2 w-full border rounded" />
                <label className="flex items-center mb-4">
                    <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} className="mr-2" /> Private
                </label>
                {file && (
                    <p className="text-sm text-gray-600">Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                )}
                <button
                    onClick={uploadFile}
                    disabled={!file || uploading}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
                {uploading && (
                    <div className="w-full bg-gray-200 rounded-lg h-4 mt-4">
                        <div
                            className="bg-blue-500 h-4 rounded-lg"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
}
