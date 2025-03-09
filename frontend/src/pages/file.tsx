import { useState } from 'react';
import { fetchFromAPI } from '../utils/communication';
import { UploadChunk } from '../proto/upload_pb';
import Navbar from '../components/Navbar';
import CategorySelector from '../components/CategoriesSelector';
import TagSelector from '../components/TagSelector';
import BackendState from '../components/BackendState';
import { Category, Tag } from '../components/types';

const CHUNK_SIZE = 1024 * 1024; // 1 MB

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [category, setCategories] = useState<Category | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0] || null);
        }
    };

    const uploadFile = async () => {
        if (!file) {
            alert('Please select a file and category');
            return;
        }
        if (!category) {
            alert('Please select a category for the file');
            return;
        }
        setUploading(true);
        setProgress(0);

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const metadata = {
            id: null,
            title,
            ext: file.name.split('.').pop() || "bin",
            description,
            category,
            tags,
            private: isPrivate,
            total_chunks: totalChunks,
        };

        const response = await fetchFromAPI('/sound/upload/start', {
            method: 'POST',
            body: JSON.stringify(metadata),
        }, "application/json");

        if (!response.ok) {
            alert('Failed to start upload');
            setUploading(false);
            return;
        }

        const { id } = await response.json();
        metadata.id = id;

        console.log("Metadata:", metadata);

        for (let i = 0; i < totalChunks; i++) {
            const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const arrayBuffer = await chunk.arrayBuffer();
            const chunkData = new Uint8Array(arrayBuffer);
            const message = UploadChunk.create({
                id,
                chunk_number: i,
                chunk: chunkData,
                ext: file.name.split('.').pop() || "bin",
            });

            const buffer = UploadChunk.encode(message).finish();

            await fetchFromAPI("/sound/upload/chunk", {
                method: "POST",
                body: buffer,
            }, "application/octet-stream");

            setProgress(((i + 1) / totalChunks) * 100);
        }

        const finalResponse = await fetchFromAPI('/sound/upload/end', {
            method: 'POST',
            body: JSON.stringify(metadata),
        }, "application/json");

        if (!finalResponse.ok) {
            alert('Failed to upload file');
        } else {
            setFile(null);
            setTitle('');
            setDescription('');
            setTags([]);
            setCategories(null);
            setIsPrivate(false);
            setProgress(0);
            alert('File uploaded successfully');
        }

        setUploading(false);
        console.log("File upload completed!");
    };

    return (
        <>
            <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900">
                <Navbar />
                <div className="flex items-center justify-center m-auto">
                    <div className="bg-white dark:bg-zinc-800 shadow-lg p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-4">
                            Upload File
                        </h2>

                        {/* File Upload Button */}
                        <label className="flex flex-col items-center justify-center w-full p-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600 transition">
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Choose a file</span>
                            <input type="file" onChange={handleFileChange} className="hidden" />
                        </label>

                        {/* Selected File Info */}
                        {file && (
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        )}

                        {/* Inputs */}
                        <input 
                            type="text" 
                            placeholder="Title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="mt-3 p-2 w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <textarea 
                            placeholder="Description" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            className="mt-3 p-2 w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />

                        {/* Category & Tags */}
                        <CategorySelector onCategoryChange={setCategories} />
                        <TagSelector onTagChange={setTags} />

                        {/* Private Checkbox */}
                        <label className="flex items-center mt-3 text-zinc-700 dark:text-zinc-300">
                            <input 
                                type="checkbox" 
                                checked={isPrivate} 
                                onChange={() => setIsPrivate(!isPrivate)} 
                                className="mr-2"
                            /> 
                            Private
                        </label>

                        {/* Upload Button */}
                        <button
                            onClick={uploadFile}
                            disabled={!file || uploading}
                            className="mt-4 px-4 py-2 text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:bg-zinc-400 transition"
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="w-full bg-zinc-300 dark:bg-zinc-700 rounded-lg h-4 mt-4">
                                <div
                                    className="bg-emerald-500 h-4 rounded-lg"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
                <BackendState />
            </div>
        </>
    );
}

