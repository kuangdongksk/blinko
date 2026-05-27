import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { ArticleStore } from "@/store/articleStore";
import { Divider } from "@heroui/react";
import { observer } from "mobx-react-lite";
import ArticleHeader from "./ArticleHeader";

interface ArticleCreatorProps {
  articleStore: ArticleStore;
  articleId: string | null;
}

export const ArticleCreator = observer(
  ({ articleStore, articleId }: ArticleCreatorProps) => {
    return (
      <div className="flex-1 border-r px-6 py-4 overflow-hidden flex flex-col">
        <ArticleHeader articleStore={articleStore} articleId={articleId} />

        <Divider className="mb-4" />

        {/* Article Sections */}
        <ScrollArea className="flex-1">
          {articleStore.loadArticle.loading ? (
            <LoadingAndEmpty isLoading={true} isEmpty={false} />
          ) : articleStore.currentSections.length === 0 ? (
            <LoadingAndEmpty isLoading={false} isEmpty={true} />
          ) : (
            <div></div>
          )}
        </ScrollArea>
      </div>
    );
  },
);

export default ArticleCreator;
