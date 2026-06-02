import { z } from 'zod';
import { prisma } from '../prisma';
import { authProcedure, router } from '@server/middleware';

export const articleRouter = router({
  list: authProcedure
    .query(async ({ ctx }) => {
      return prisma.articles.findMany({
        where: { accountId: Number(ctx.id) },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          sectionNoteIds: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }),

  getById: authProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return prisma.articles.findFirst({
        where: { id: input.id, accountId: Number(ctx.id) },
      });
    }),

  create: authProcedure
    .input(z.object({
      title: z.string().default('未命名文章'),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.articles.create({
        data: {
          title: input.title,
          description: input.description,
          accountId: Number(ctx.id),
        },
      });
    }),

  update: authProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const article = await prisma.articles.findFirst({
        where: { id, accountId: Number(ctx.id) },
      });
      if (!article) throw new Error('Article not found');
      return prisma.articles.update({
        where: { id },
        data,
      });
    }),

  delete: authProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.articles.findFirst({
        where: { id: input.id, accountId: Number(ctx.id) },
      });
      if (!article) throw new Error('Article not found');
      return prisma.articles.delete({
        where: { id: input.id },
      });
    }),

  addNote: authProcedure
    .input(z.object({
      articleId: z.number(),
      noteId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.articles.findFirst({
        where: { id: input.articleId, accountId: Number(ctx.id) },
      });
      if (!article) throw new Error('Article not found');

      const noteIds: number[] = Array.isArray(article.sectionNoteIds)
        ? article.sectionNoteIds as number[]
        : [];
      if (!noteIds.includes(input.noteId)) {
        noteIds.push(input.noteId);
      }

      return prisma.articles.update({
        where: { id: input.articleId },
        data: { sectionNoteIds: noteIds },
      });
    }),

  removeNote: authProcedure
    .input(z.object({
      articleId: z.number(),
      noteId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.articles.findFirst({
        where: { id: input.articleId, accountId: Number(ctx.id) },
      });
      if (!article) throw new Error('Article not found');

      const noteIds: number[] = (Array.isArray(article.sectionNoteIds)
        ? article.sectionNoteIds as number[]
        : []).filter((id: number) => id !== input.noteId);

      return prisma.articles.update({
        where: { id: input.articleId },
        data: { sectionNoteIds: noteIds },
      });
    }),

  reorder: authProcedure
    .input(z.object({
      articleId: z.number(),
      sectionNoteIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.articles.findFirst({
        where: { id: input.articleId, accountId: Number(ctx.id) },
      });
      if (!article) throw new Error('Article not found');
      return prisma.articles.update({
        where: { id: input.articleId },
        data: { sectionNoteIds: input.sectionNoteIds },
      });
    }),
});
