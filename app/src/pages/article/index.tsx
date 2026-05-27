import { RootStore } from "@/store";
import { ArticleStore } from "@/store/articleStore";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArticleCreator } from "./components/articleCreator";
import { ArticleList } from "./components/articleList";
import { NoteList } from "./components/noteList";
import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";

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

  return (
    <Group>
      <Panel collapsible minSize={300} defaultSize={310}>
        <ArticleList
          articleStore={articleStore}
          onCreateNewArticle={handleCreateNewArticle}
        />
      </Panel>
      <Separator className="bg-accent w-1.5" />
      <Panel>
        {articleId ? (
          <ArticleCreator articleStore={articleStore} articleId={articleId} />
        ) : (
          <LoadingAndEmpty isLoading={false} isEmpty={true} />
        )}
      </Panel>
      <Separator className="bg-accent w-1.5" />
      <Panel collapsible minSize={410} defaultSize={420}>
        <NoteList articleStore={articleStore} articleId={articleId} />
      </Panel>
    </Group>
  );
});

export default ArticlePage;
