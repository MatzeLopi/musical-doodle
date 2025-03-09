import { Category } from "./types";

const CategoryBadge: React.FC<{ category: Category }> = ({ category }) => {
  return (
    <span className="bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-xs font-semibold px-3 py-1 rounded-md">
      {category.name}
    </span>
  );
};

export default CategoryBadge;