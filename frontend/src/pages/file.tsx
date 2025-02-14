
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { fetchFromAPI } from '../utils/communication';

const CHUNK_SIZE = 1.5 * 1024 * 1024; // 2MB

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<{ label: string; value: string }[]>([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [availableTags, setAvailableTags] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchCategoriesAndTags = async () => {
            try {
                const categoriesResponse = await fetchFromAPI('/sound/categories');
                const tagsResponse = await fetchFromAPI('/sound/tags');
                const categoriesData = await categoriesResponse.json();
                const tagsData = await tagsResponse.json();

                setCategories(categoriesData.map((cat: any) => ({ label: cat.name, value: cat.id })));
                setAvailableTags(tagsData.map((tag: any) => ({ label: tag.name, value: tag.id })));
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
        if (!file || !category) return;
        setUploading(true);
        setProgress(0);

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        const selectedCategory = categories.find(cat => cat.value === category);
        formData.append('category', JSON.stringify({ id: category, name: selectedCategory ? selectedCategory.label : '' }));
        formData.append('tags', JSON.stringify(tags.map(tag => ({ id: tag.value, name: tag.label }))));
        formData.append('private', isPrivate.toString());
        formData.append('filename', file.name); // Send filename with each chunk
        formData.append('totalChunks', totalChunks.toString());

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const chunk = file.slice(start, end);

            formData.append('file', chunk, file.name); // Include filename
            formData.append('chunkIndex', i.toString());


            try {
                const response = await fetchFromAPI('/sound/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for chunk ${i + 1}: ${response.status} ${response.statusText}`);
                }

                setProgress(((i + 1) / totalChunks) * 100);
            } catch (error) {
                console.error(error);
                setUploading(false);
                if (error instanceof Error) {
                    alert(`Upload failed: ${error.message}`);
                } else {
                    alert('Upload failed: An unknown error occurred.');
                }
                return; // Stop the upload
            }
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

                {/* Category Select Dropdown */}
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mb-2 p-2 w-full border rounded">
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>

                {/* Tags Multi-Select Dropdown */}
                <Select
                    isMulti
                    options={availableTags}
                    value={tags}
                    onChange={(selected: any) => setTags(selected as { label: string; value: string }[])}
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
    );
}
