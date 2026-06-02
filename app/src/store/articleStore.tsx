"use client";
import { PromiseState } from './standard/PromiseState';
import { Store } from './standard/base';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import i18n from '@/lib/i18n';
import { api } from '@/lib/trpc';
import { Article, ArticleSection, type Note } from '@shared/lib/types';
import { makeAutoObservable } from 'mobx';

export class ArticleStore implements Store {
  sid = 'ArticleStore';

  currentArticle: Article | null = null;
  articlesList: any[] = [];
  searchQuery: string = '';
  availableNotes: Note[] = [];
  isLoadingNotes = false;

  constructor() {
    makeAutoObservable(this);
  }

  get articles() {
    return this.articlesList;
  }

  get currentSections(): ArticleSection[] {
    return this.currentArticle?.sections || [];
  }

  // List all articles
  listArticles = new PromiseState({
    eventKey: 'listArticles',
    function: async () => {
      const articles = await api.articles.list.query();
      this.articlesList = articles;
      return articles;
    }
  });

  // Load article by id
  loadArticle = new PromiseState({
    eventKey: 'loadArticle',
    function: async (articleId: number) => {
      const articleData = await api.articles.getById.query({ id: articleId });
      if (!articleData) {
        throw new Error('Article not found');
      }

      const sectionNoteIds: number[] = Array.isArray(articleData.sectionNoteIds)
        ? articleData.sectionNoteIds as number[]
        : [];

      const notes = sectionNoteIds.length > 0
        ? await api.notes.listByIds.mutate({ ids: sectionNoteIds })
        : [];

      const sections: ArticleSection[] = sectionNoteIds
        .map((noteId, index) => ({
          noteId,
          order: index,
          note: notes.find((n: any) => n.id === noteId),
        }))
        .filter(section => section.note !== undefined);

      this.currentArticle = {
        id: articleData.id,
        title: articleData.title,
        description: articleData.description ?? undefined,
        sections,
        createdAt: new Date(articleData.createdAt),
        updatedAt: new Date(articleData.updatedAt),
        isPublished: articleData.isPublished,
      };

      return this.currentArticle;
    }
  });

  // Create new article
  createArticle = new PromiseState({
    eventKey: 'createArticle',
    function: async (params: { title: string; description?: string }) => {
      const newArticle = await api.articles.create.mutate(params);
      RootStore.Get(ToastPlugin).success(i18n.t('article-created'));
      await this.listArticles.call();
      return newArticle;
    }
  });

  // Update article
  updateArticle = new PromiseState({
    eventKey: 'updateArticle',
    function: async (articleId: number, params: { title?: string; description?: string | null; isPublished?: boolean }) => {
      const updated = await api.articles.update.mutate({ id: articleId, ...params });
      RootStore.Get(ToastPlugin).success(i18n.t('article-updated'));

      if (this.currentArticle?.id === articleId) {
        this.currentArticle = {
          ...this.currentArticle,
          title: updated.title,
          description: updated.description ?? undefined,
          updatedAt: new Date(updated.updatedAt),
        };
      }

      await this.listArticles.call();
      return updated;
    }
  });

  // Add note to article
  addNoteToArticle = new PromiseState({
    eventKey: 'addNoteToArticle',
    function: async (articleId: number, noteId: number) => {
      await api.articles.addNote.mutate({ articleId, noteId });
      RootStore.Get(ToastPlugin).success(i18n.t('note-added-to-article'));
      if (this.currentArticle?.id === articleId) {
        await this.loadArticle.call(articleId);
      }
      await this.listArticles.call();
    }
  });

  // Remove note from article
  removeNoteFromArticle = new PromiseState({
    eventKey: 'removeNoteFromArticle',
    function: async (articleId: number, noteId: number) => {
      await api.articles.removeNote.mutate({ articleId, noteId });
      RootStore.Get(ToastPlugin).success(i18n.t('note-removed-from-article'));
      if (this.currentArticle?.id === articleId) {
        await this.loadArticle.call(articleId);
      }
      await this.listArticles.call();
    }
  });

  // Reorder sections in article
  reorderSections = new PromiseState({
    eventKey: 'reorderSections',
    function: async (articleId: number, sectionNoteIds: number[]) => {
      await api.articles.reorder.mutate({ articleId, sectionNoteIds });
      if (this.currentArticle?.id === articleId) {
        await this.loadArticle.call(articleId);
      }
      await this.listArticles.call();
    }
  });

  // Delete article
  deleteArticle = new PromiseState({
    eventKey: 'deleteArticle',
    function: async (articleId: number) => {
      await api.articles.delete.mutate({ id: articleId });
      if (this.currentArticle?.id === articleId) {
        this.currentArticle = null;
      }
      RootStore.Get(ToastPlugin).success(i18n.t('article-deleted'));
      await this.listArticles.call();
    }
  });

  // Load available notes for adding to article
  loadAvailableNotes = new PromiseState({
    eventKey: 'loadAvailableNotes',
    function: async (searchText?: string) => {
      this.isLoadingNotes = true;
      try {
        const notes = await api.notes.list.mutate({
          page: 1,
          size: 100,
          searchText,
          isRecycle: false,
        });
        this.availableNotes = notes;
        return notes;
      } finally {
        this.isLoadingNotes = false;
      }
    }
  });

  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  clearCurrentArticle() {
    this.currentArticle = null;
  }
}
