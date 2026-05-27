import { Icon } from "@/components/Common/Iconify/icons";
import { ArticleStore } from "@/store/articleStore";
import { Input, Textarea, Button } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ArticleHeaderProps {
  articleStore: ArticleStore;
  articleId: string | null;
}

const ArticleHeader = observer(
  ({ articleStore, articleId }: ArticleHeaderProps) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    useEffect(() => {
      if (articleStore.currentArticle) {
        setEditTitle(articleStore.currentArticle.title);
        setEditDescription(articleStore.currentArticle.description || "");
      }
    }, [articleStore.currentArticle]);

    const handleSaveArticle = async () => {
      if (articleId) {
        await articleStore.updateArticle.call(articleId, {
          title: editTitle,
          description: editDescription,
        });
        setIsEditing(false);
      }
    };

    return (
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t("article-title")}
              variant="bordered"
              size="lg"
              className="font-bold"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t("article-description")}
              variant="bordered"
              minRows={2}
            />
            <div className="flex gap-2">
              <Button color="primary" size="sm" onPress={handleSaveArticle}>
                {t("save")}
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setIsEditing(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {articleStore.currentArticle?.title}
              </h1>
              {articleStore.currentArticle?.description && (
                <p className="text-default-500">
                  {articleStore.currentArticle.description}
                </p>
              )}
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsEditing(true)}
            >
              <Icon icon="mdi:pencil" width="20" height="20" />
            </Button>
          </div>
        )}
      </div>
    );
  },
);

export default ArticleHeader;
