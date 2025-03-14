import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import BackendState from '../components/BackendState';
import SearchComponent from '../components/Search';
import { fetchFromAPI } from '../utils/communication';
import AudioList from '../components/AudioList';
import { Audio, SearchFilters } from '../components/types';
import Info from '../components/Info';
import { Page } from '../components/types';


const Search: React.FC = () => {
    const [data, setData] = useState<Audio[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({});

    const handleSearch = async (filters: SearchFilters) => {
        setFilters(filters);
        console.log('Search filters:', filters);
        try {
            let response = await fetchFromAPI('/sound/search', { method: 'POST', body: JSON.stringify(filters) }, "application/json")

            if (!response.ok) {
                throw new Error('Search failed' + response.statusText);
            }

            let page: Page = await response.json();
            let data = page.items as Audio[];
            setData(data);

        } catch (err) {
            setError('Search failed: ' + (err as Error).message);
            console.debug('Search failed:', err);
        }


    };

    return (
        <>
            <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900">
                <Navbar />
                {error && <Info type='error' message={error} onClose={() => setError(null)} />}
                <div className="flex justify-center p-4">
                    <SearchComponent onSearch={handleSearch} />
                </div>
                <AudioList audios={data} />
                <BackendState />
            </div>
        </>);
}

export default Search;