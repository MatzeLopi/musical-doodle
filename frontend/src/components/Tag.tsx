import { Tag } from "./types";

const TagBadge: React.FC<{ tag: Tag }> = ({ tag }) => {
    return (
        <span className="bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-xs font-semibold px-3 py-1 rounded-md mr-1">
        {tag.name}
        </span>
    );
};

export default TagBadge;
