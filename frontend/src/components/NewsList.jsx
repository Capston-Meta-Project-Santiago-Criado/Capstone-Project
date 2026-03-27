import NewsArticle from "./NewsArticle";

const NewsList = ({ newsData }) => {
  if (newsData == null || !Array.isArray(newsData)) {
    return null;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {newsData.map((value) => (
        <NewsArticle
          title={value.title}
          images={value.images}
          key={value.id}
          link={value.link}
          source={value.source}
        />
      ))}
    </div>
  );
};

export default NewsList;
