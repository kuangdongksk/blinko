import Icon from "@/components/Common/Iconify/icons";
import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { RootStore } from "@/store";
import { ArticleStore } from "@/store/articleStore";
import { Button } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArticleCreator } from "./components/articleCreator";
import { NoteList } from "./components/noteList";

const ArticlePage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get("id");

  const articleStore = RootStore.Get(ArticleStore);

  useEffect(() => {
    if (articleId) {
      articleStore.loadArticle.call(articleId);
    }
    // Load available notes
    articleStore.loadAvailableNotes.call();
  }, [articleId]);

  const handleCreateNewArticle = async () => {
    const result = await articleStore.createArticle.call({
      title: t("untitled-article"),
      description: "",
    });
    if (result) {
      navigate(`/article?id=${result.id}`);
    }
  };

  if (!articleId) {
    // Show article list
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("articles")}</h1>
          <Button color="primary" onPress={handleCreateNewArticle}>
            <Icon icon="mdi:plus" width="20" height="20" className="mr-1" />
            {t("create-article")}
          </Button>
        </div>

        <LoadingAndEmpty
          isLoading={false}
          isEmpty={articleStore.articles.length === 0}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articleStore.articles.map((article) => (
            <div
              key={article.id}
              className="p-4 border rounded-lg hover:bg-default-100 cursor-pointer transition-colors"
              onClick={() => navigate(`/article?id=${article.id}`)}
            >
              <h3 className="font-bold mb-2">{article.title}</h3>
              {article.description && (
                <p className="text-sm text-default-500 mb-2">
                  {article.description}
                </p>
              )}
              <div className="text-xs text-default-400">
                {article.sectionNoteIds.length} {t("sections")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Article Content */}
      <ArticleCreator
        articleStore={articleStore}
        articleId={articleId}
      />

      {/* Right Panel - Note List */}
      <NoteList
        articleStore={articleStore}
        articleId={articleId}
      />
    </div>
  );
});

export default ArticlePage;
