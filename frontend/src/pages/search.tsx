import Navbar from '../components/Navbar';
import BackendState from '../components/BackendState';
import SearchComponent, {SearchFilters} from '../components/Search';
const handleSearch = (filters: SearchFilters) => {
    console.log('Search filters:', filters);
    // Implement your search logic using the filters here.
  };

const Search: React.FC = () => {
    return (
        <>
            <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900">
                <Navbar />
                <div className="flex justify-center p-4">
                <SearchComponent onSearch={handleSearch} />
                </div>
                <BackendState />
            </div>
        </>);
}

export default Search;