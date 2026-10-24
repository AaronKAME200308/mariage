import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.email('Adresse e-mail invalide.'),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
      .max(72, 'Le mot de passe ne doit pas dépasser 72 caractères.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Les mots de passe ne correspondent pas.',
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Indiquez votre nom.').max(120, 'Nom trop long.'),
  email: z.email('Adresse e-mail invalide.').max(254),
  subject: z.string().trim().max(160, 'Objet trop long.').optional(),
  message: z
    .string()
    .trim()
    .min(5, 'Votre message est trop court.')
    .max(3000, 'Votre message ne doit pas dépasser 3 000 caractères.'),
})
export type ContactValues = z.infer<typeof contactSchema>
