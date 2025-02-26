
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { fetchFromAPI } from '../utils/communication';
import { UploadChunk } from '../proto/upload_pb';
import Navbar from '../components/Navbar';

const CHUNK_SIZE = 1024 * 1024; // 1 MB

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<{ name: string; id: string }[]>([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [categories, setCategories] = useState<{ name: string; id: string }[]>([]);
    const [availableTags, setAvailableTags] = useState<{ name: string; id: string }[]>([]);

    useEffect(() => {
        const fetchCategoriesAndTags = async () => {
            try {
                const categoriesResponse = await fetchFromAPI('/sound/categories');
                const tagsResponse = await fetchFromAPI('/sound/tags');
                const categoriesData = await categoriesResponse.json();
                const tagsData = await tagsResponse.json();

                setCategories(categoriesData.map((cat: any) => ({ name: cat.name, id: cat.id })));
                setAvailableTags(tagsData.map((tag: any) => ({ name: tag.name, id: tag.id })));

                console.log('Categories:', categoriesData);
                console.log('Tags:', tagsData);

            } catch (error) {
                console.error('Failed to fetch categories or tags:', error);
            }
        };

        fetchCategoriesAndTags();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0] || null);
        }
    };

    const uploadFile = async () => {
        if (!file || !category) {
            alert('Please select a file and category');
            return;
        };
        setUploading(true);
        setProgress(0);

        const chunkSize = 1024 * 1024; // 1MB per chunk
        const totalChunks = Math.ceil(file.size / chunkSize);


        const metadata = {
            id: null,
            title: title,
            ext: file.name.split('.').pop() || "bin",
            description: description,
            category: categories.find((cat) => cat.id === category),
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

                        {/* Category Select Dropdown */}
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mb-2 p-2 w-full border rounded">
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        {/* Tags Multi-Select Dropdown */}
                        <Select
                            isMulti
                            options={availableTags.map((tag) => ({ value: tag.id, label: tag.name }))}
                            value={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                            onChange={(selected: any) =>
                                setTags(selected.map((tag: { value: string; label: string }) => ({
                                    id: tag.value,
                                    name: tag.label
                                })))
                            }
                            className="mb-2"
                        />

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
            </div>
        </>
    );
}
