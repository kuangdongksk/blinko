import Icon from "@/components/Common/Iconify/icons";
import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { ArticleStore } from "@/store/articleStore";
import { Button } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ArticleListProps {
  articleStore: ArticleStore;
  onCreateNewArticle: () => void;
}

export const ArticleList = observer(
  ({ articleStore, onCreateNewArticle }: ArticleListProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
      <div className="h-full flex flex-col">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t("articles")}</h1>
            <Button color="primary" onPress={onCreateNewArticle}>
              <Icon icon="mdi:plus" width="20" height="20" className="mr-1" />
              {t("create-article")}
            </Button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-6 overflow-y-auto">
          <LoadingAndEmpty
            isLoading={false}
            isEmpty={articleStore.articles.length === 0}
          />
          <div className="space-y-2">
            {articleStore.articles.map((article) => (
              <div
                key={article.id}
                className="p-4 border rounded-lg hover:bg-default-100 cursor-pointer transition-colors group"
                onClick={() => navigate(`/article?id=${article.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 truncate">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-sm text-default-500 mb-2 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="text-xs text-default-400">
                      {article.sectionNoteIds.length} {t("sections")}
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon icon="mdi:chevron-right" width="20" height="20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

export default ArticleList;
