
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { fetchFromAPI } from '../utils/communication';
import { UploadChunk } from '../proto/upload_pb';
import Navbar from '../components/Navbar';
import CategorySelector, {Category} from '../components/CategoriesSelector';
import TagSelector, {Tag} from '../components/TagSelector';
import BackendState from '../components/BackendState';

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
        };
        if (!category) {
            alert('Please select a category for the file');
            return;
        }
        setUploading(true);
        setProgress(0);

        const chunkSize = 1024 * 1024; // 1MB per chunk
        const totalChunks = Math.ceil(file.size / chunkSize);


        const metadata = {
            id: null,
            title: title,
            ext: file.name.split('.').pop() || "bin",
            description: description,
            category: category,
            tags: tags,
            private: isPrivate,
            total_chunks: totalChunks
        }

        const response = await fetchFromAPI('/sound/upload/start', {
            method: 'POST',
            body: JSON.stringify(metadata)
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
            const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
           const arrayBuffer = await chunk.arrayBuffer();
            const chunkData = new Uint8Array(arrayBuffer); // Convert to bytes
            // Create a Protobuf message
            const message = UploadChunk.create({
                id,
                chunk_number: i,
                chunk: chunkData,
                ext: file.name.split('.').pop() || "bin"
            });
            console.log("Chunk:", message);

            // Serialize to Protobuf binary format
            const buffer = UploadChunk.encode(message).finish();

            await fetchFromAPI("/sound/upload/chunk", {
                method: "POST",
                body: buffer
            }, "application/octet-stream");
            setProgress(((i + 1) / totalChunks) * 100);

        }

        const finalResponse = await fetchFromAPI('/sound/upload/end', {
            method: 'POST',
            body: JSON.stringify(metadata)
        }, "application/json");

        if (!finalResponse.ok) {
            alert('Failed to upload file');
            setUploading(false);
            return;
        } else {
            setUploading(false);
            setProgress(0);
            alert('File uploaded successfully');
        }

        console.log("File upload completed!");
    };

    const handleTagChange = (tags: Tag[]) => {
        setTags(tags);
    };

    const handleCategoryChange = (category: Category | null) => {
        setCategories(category);
    };

    return (
        <>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex items-center justify-center m-auto">
                    <div className="bg-white shadow-lg p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Upload File in Chunks</h2>
                        <input type="file" onChange={handleFileChange} className="mb-4" />
                        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 p-2 w-full border rounded" />
                        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-2 p-2 w-full border rounded" />

                        {/* Category Dropdown */}
                        <CategorySelector onCategoryChange={handleCategoryChange} />

                        {/* Tags Multi-Select Dropdown */}
                        <TagSelector onTagChange={handleTagChange} />

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
                <BackendState />
            </div>
        </>
    );
}
