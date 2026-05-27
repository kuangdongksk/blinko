"use client";
import { PromisePageState, PromiseState } from './standard/PromiseState';
import { Store } from './standard/base';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import i18n from '@/lib/i18n';
import { api } from '@/lib/trpc';
import { Article, ArticleSection, type Note } from '@shared/lib/types';
import { makeAutoObservable } from 'mobx';
import { StorageListState } from './standard/StorageListState';

interface ArticleConfig {
  id: string;
  title: string;
  description?: string;
  sectionNoteIds: number[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export class ArticleStore implements Store {
  sid = 'ArticleStore';

  // Current article being viewed/edited
  currentArticle: Article | null = null;

  // List of all articles
  articlesList = new StorageListState<ArticleConfig>({
    key: 'articles',
  });

  // Search query for note list
  searchQuery: string = '';

  // Available notes that can be added to article
  availableNotes: Note[] = [];

  // Loading states
  isLoadingNotes = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Get articles list from storage
  get articles(): ArticleConfig[] {
    return this.articlesList.list || [];
  }

  // Get current article sections
  get currentSections(): ArticleSection[] {
    return this.currentArticle?.sections || [];
  }

  // Load article by id
  loadArticle = new PromiseState({
    eventKey: 'loadArticle',
    function: async (articleId: string) => {
      const articleConfig = this.articles.find(a => a.id === articleId);
      if (!articleConfig) {
        throw new Error('Article not found');
      }

      // Fetch all notes for this article
      const notes = await api.notes.list.mutate({
        page: 1,
        size: 100,
        isRecycle: false,
      });

      const filteredNotes = notes.filter(note =>
        articleConfig.sectionNoteIds.includes(note.id!)
      );

      // Create sections with order
      const sections: ArticleSection[] = articleConfig.sectionNoteIds
        .map((noteId, index) => ({
          noteId,
          order: index,
          note: filteredNotes.find(n => n.id === noteId),
        }))
        .filter(section => section.note !== undefined);

      this.currentArticle = {
        id: articleConfig.id,
        title: articleConfig.title,
        description: articleConfig.description,
        sections,
        createdAt: new Date(articleConfig.createdAt),
        updatedAt: new Date(articleConfig.updatedAt),
        isPublished: articleConfig.isPublished,
      };

      return this.currentArticle;
    }
  });

  // Create new article
  createArticle = new PromiseState({
    eventKey: 'createArticle',
    function: async (params: { title: string; description?: string }) => {
      const newArticle: ArticleConfig = {
        id: `article_${Date.now()}`,
        title: params.title,
        description: params.description,
        sectionNoteIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false,
      };

      this.articlesList.push(newArticle);
      RootStore.Get(ToastPlugin).success(i18n.t('article-created'));

      return newArticle;
    }
  });

  // Update article
  updateArticle = new PromiseState({
    eventKey: 'updateArticle',
    function: async (articleId: string, params: Partial<ArticleConfig>) => {
      const articles = this.articles;
      const index = articles.findIndex(a => a.id === articleId);

      if (index !== -1) {
        const updatedArticle = {
          ...articles[index],
          ...params,
          updatedAt: new Date().toISOString(),
        };

        // Update storage list
        this.articlesList.remove(index);
        this.articlesList.push(updatedArticle);

        // Update current article if it's the same
        if (this.currentArticle?.id === articleId) {
          this.currentArticle = {
            ...this.currentArticle,
            title: updatedArticle.title,
            description: updatedArticle.description,
            updatedAt: new Date(updatedArticle.updatedAt),
          };
        }

        RootStore.Get(ToastPlugin).success(i18n.t('article-updated'));
        return updatedArticle;
      }

      throw new Error('Article not found');
    }
  });

  // Add note to article
  addNoteToArticle = new PromiseState({
    eventKey: 'addNoteToArticle',
    function: async (articleId: string, noteId: number) => {
      const articles = this.articles;
      const index = articles.findIndex(a => a.id === articleId);

      if (index !== -1) {
        const article = articles[index];

        if (!article.sectionNoteIds.includes(noteId)) {
          const updatedArticle = {
            ...article,
            sectionNoteIds: [...article.sectionNoteIds, noteId],
            updatedAt: new Date().toISOString(),
          };

          this.articlesList.remove(index);
          this.articlesList.push(updatedArticle);

          // Reload article if it's current
          if (this.currentArticle?.id === articleId) {
            await this.loadArticle.call(articleId);
          }

          RootStore.Get(ToastPlugin).success(i18n.t('note-added-to-article'));
          return updatedArticle;
        }
      }

      throw new Error('Article not found or note already exists');
    }
  });

  // Remove note from article
  removeNoteFromArticle = new PromiseState({
    eventKey: 'removeNoteFromArticle',
    function: async (articleId: string, noteId: number) => {
      const articles = this.articles;
      const index = articles.findIndex(a => a.id === articleId);

      if (index !== -1) {
        const article = articles[index];
        const updatedArticle = {
          ...article,
          sectionNoteIds: article.sectionNoteIds.filter(id => id !== noteId),
          updatedAt: new Date().toISOString(),
        };

        this.articlesList.remove(index);
        this.articlesList.push(updatedArticle);

        // Reload article if it's current
        if (this.currentArticle?.id === articleId) {
          await this.loadArticle.call(articleId);
        }

        RootStore.Get(ToastPlugin).success(i18n.t('note-removed-from-article'));
        return updatedArticle;
      }

      throw new Error('Article not found');
    }
  });

  // Reorder sections in article
  reorderSections = new PromiseState({
    eventKey: 'reorderSections',
    function: async (articleId: string, sectionNoteIds: number[]) => {
      const articles = this.articles;
      const index = articles.findIndex(a => a.id === articleId);

      if (index !== -1) {
        const updatedArticle = {
          ...articles[index],
          sectionNoteIds,
          updatedAt: new Date().toISOString(),
        };

        this.articlesList.remove(index);
        this.articlesList.push(updatedArticle);

        // Reload article if it's current
        if (this.currentArticle?.id === articleId) {
          await this.loadArticle.call(articleId);
        }

        return updatedArticle;
      }

      throw new Error('Article not found');
    }
  });

  // Delete article
  deleteArticle = new PromiseState({
    eventKey: 'deleteArticle',
    function: async (articleId: string) => {
      const articles = this.articles;
      const index = articles.findIndex(a => a.id === articleId);

      if (index !== -1) {
        this.articlesList.remove(index);

        if (this.currentArticle?.id === articleId) {
          this.currentArticle = null;
        }

        RootStore.Get(ToastPlugin).success(i18n.t('article-deleted'));
        return true;
      }

      throw new Error('Article not found');
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
          size: 50,
          searchText,
          isRecycle: false,
          type: 1, // NOTE type only
        });

        this.availableNotes = notes;
        return notes;
      } finally {
        this.isLoadingNotes = false;
      }
    }
  });

  // Set search query
  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  // Clear current article
  clearCurrentArticle() {
    this.currentArticle = null;
  }
}