'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface FormData {
  title: string;
  start: string;
  end: string;
  location: string;
  url: string;
  tag: string;
  brandmeister: boolean;
  talkgroup: string;
  submitterEmail: string;
  honeypot: string;
}

interface FormErrors {
  title?: string;
  start?: string;
  end?: string;
  url?: string;
  talkgroup?: string;
  submitterEmail?: string;
}

const API_BASE_URL = (() => {
  const source =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
      : process.env.PAYLOAD_API_BASE_URL || process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000';
  return source.replace(/\/$/, '');
})();

export default function EventSubmitDialog() {
  const t = useTranslations('events.submit');
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [errors, setErrors] = React.useState<FormErrors>({});

  const [formData, setFormData] = React.useState<FormData>({
    title: '',
    start: '',
    end: '',
    location: '',
    url: '',
    tag: '',
    brandmeister: false,
    talkgroup: '',
    submitterEmail: '',
    honeypot: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      start: '',
      end: '',
      location: '',
      url: '',
      tag: '',
      brandmeister: false,
      talkgroup: '',
      submitterEmail: '',
      honeypot: '',
    });
    setErrors({});
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(resetForm, 200);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      newErrors.title = t('errors.titleRequired');
    }

    if (!formData.start) {
      newErrors.start = t('errors.startRequired');
    } else {
      const startDate = new Date(formData.start);
      if (startDate < new Date()) {
        newErrors.start = t('errors.startFuture');
      }
    }

    if (formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      if (endDate <= startDate) {
        newErrors.end = t('errors.endAfterStart');
      }
    }

    if (formData.url) {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = t('errors.invalidUrl');
      }
    }

    if (formData.brandmeister && formData.talkgroup) {
      const tg = Number(formData.talkgroup);
      if (isNaN(tg) || tg <= 0) {
        newErrors.talkgroup = t('errors.invalidTalkgroup');
      }
    }

    if (formData.submitterEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.submitterEmail)) {
        newErrors.submitterEmail = t('errors.invalidEmail');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          start: new Date(formData.start).toISOString(),
          end: formData.end ? new Date(formData.end).toISOString() : undefined,
          location: formData.location.trim() || undefined,
          url: formData.url.trim() || undefined,
          tag: formData.tag || undefined,
          brandmeister: formData.brandmeister,
          talkgroup: formData.brandmeister && formData.talkgroup ? Number(formData.talkgroup) : undefined,
          submitterEmail: formData.submitterEmail.trim() || undefined,
          honeypot: formData.honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(t('errors.rateLimit'));
        }
        throw new Error(data.error || t('errors.unknown'));
      }

      setSubmitStatus('success');
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('errors.unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-enable brandmeister when tag is 'Net'
      if (field === 'tag' && value === 'Net' && !prev.brandmeister) {
        updated.brandmeister = true;
      }
      return updated;
    });
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          {t('button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center font-medium">{t('successMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field - hidden from users */}
            <input
              type="text"
              name="website"
              value={formData.honeypot}
              onChange={(e) => updateField('honeypot', e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px' }}
              aria-hidden="true"
            />

            <div className="space-y-2">
              <Label htmlFor="title">
                {t('fields.title')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={t('placeholders.title')}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">
                  {t('fields.start')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) => updateField('start', e.target.value)}
                  aria-invalid={!!errors.start}
                />
                {errors.start && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.start}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">{t('fields.end')}</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) => updateField('end', e.target.value)}
                  aria-invalid={!!errors.end}
                />
                {errors.end && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.end}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('fields.location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder={t('placeholders.location')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">{t('fields.url')}</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder={t('placeholders.url')}
                aria-invalid={!!errors.url}
              />
              {errors.url && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.url}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">{t('fields.tag')}</Label>
              <Select value={formData.tag} onValueChange={(value) => updateField('tag', value)}>
                <SelectTrigger id="tag">
                  <SelectValue placeholder={t('placeholders.tag')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net">Net</SelectItem>
                  <SelectItem value="Contest">Contest</SelectItem>
                  <SelectItem value="Meetup">Meetup</SelectItem>
                  <SelectItem value="Satellite">Satellite</SelectItem>
                  <SelectItem value="DX">DX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="brandmeister">{t('fields.brandmeister')}</Label>
                  <p className="text-xs text-muted-foreground">{t('brandmeisterNote')}</p>
                </div>
                <Switch
                  id="brandmeister"
                  checked={formData.brandmeister}
                  onCheckedChange={(checked) => updateField('brandmeister', checked)}
                />
              </div>

              {formData.brandmeister && (
                <div className="space-y-2">
                  <Label htmlFor="talkgroup">{t('fields.talkgroup')}</Label>
                  <Input
                    id="talkgroup"
                    type="number"
                    value={formData.talkgroup}
                    onChange={(e) => updateField('talkgroup', e.target.value)}
                    placeholder={t('placeholders.talkgroup')}
                    aria-invalid={!!errors.talkgroup}
                  />
                  {errors.talkgroup && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.talkgroup}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitterEmail">{t('fields.email')}</Label>
              <Input
                id="submitterEmail"
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => updateField('submitterEmail', e.target.value)}
                placeholder={t('placeholders.email')}
                aria-invalid={!!errors.submitterEmail}
              />
              <p className="text-xs text-muted-foreground">{t('emailNote')}</p>
              {errors.submitterEmail && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.submitterEmail}
                </p>
              )}
            </div>

            {submitStatus === 'error' && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
