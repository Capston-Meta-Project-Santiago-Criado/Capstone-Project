const NewsArticle = ({ title, images, link, source }) => {
  const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return (
    <a href={link} target="_blank" rel="noreferrer" className="group flex flex-col bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-200">
      {imageUrl && (
        <div className="w-full aspect-video overflow-hidden shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-white text-sm font-semibold leading-snug line-clamp-3">{title}</p>
        <p className="text-emerald-400 text-xs font-mono mt-auto">{source}</p>
      </div>
    </a>
  );
};

export default NewsArticle;
