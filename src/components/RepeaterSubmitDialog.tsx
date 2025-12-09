'use client';

import { type Repeater } from '@/app/columns';
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
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Loader2, MapPin, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface RepeaterSubmitDialogProps {
  repeaters?: Repeater[];
}

interface FormData {
  type: 'new' | 'correction' | 'status';
  existingCallsign: string;
  callsign: string;
  outputFrequency: string;
  inputFrequency: string;
  tone: string;
  modulation: string;
  latitude: string;
  longitude: string;
  owner: string;
  notes: string;
  submitterEmail: string;
  submitterCallsign: string;
  honeypot: string;
}

interface FormErrors {
  callsign?: string;
  outputFrequency?: string;
  inputFrequency?: string;
  tone?: string;
  modulation?: string;
  latitude?: string;
  longitude?: string;
  existingCallsign?: string;
  submitterEmail?: string;
}

const API_BASE_URL = (() => {
  const source =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
      : process.env.PAYLOAD_API_BASE_URL || process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000';
  return source.replace(/\/$/, '');
})();

export default function RepeaterSubmitDialog({ repeaters = [] }: RepeaterSubmitDialogProps) {
  const t = useTranslations('repeaterSubmit');
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isLocating, setIsLocating] = React.useState(false);
  const [foundRepeater, setFoundRepeater] = React.useState<Repeater | null>(null);

  const [formData, setFormData] = React.useState<FormData>({
    type: 'new',
    existingCallsign: '',
    callsign: '',
    outputFrequency: '',
    inputFrequency: '',
    tone: '',
    modulation: 'FM',
    latitude: '',
    longitude: '',
    owner: '',
    notes: '',
    submitterEmail: '',
    submitterCallsign: '',
    honeypot: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'new',
      existingCallsign: '',
      callsign: '',
      outputFrequency: '',
      inputFrequency: '',
      tone: '',
      modulation: 'FM',
      latitude: '',
      longitude: '',
      owner: '',
      notes: '',
      submitterEmail: '',
      submitterCallsign: '',
      honeypot: '',
    });
    setErrors({});
    setSubmitStatus('idle');
    setErrorMessage('');
    setFoundRepeater(null);
  };

  // Populate form with existing repeater data
  const populateFromRepeater = React.useCallback((repeater: Repeater) => {
    setFormData((prev) => ({
      ...prev,
      callsign: repeater.callsign,
      outputFrequency: repeater.outputFrequency.toString(),
      inputFrequency: repeater.inputFrequency.toString(),
      tone: repeater.tone ? repeater.tone.toString() : '',
      modulation: repeater.modulation || 'FM',
      latitude: repeater.latitude.toString(),
      longitude: repeater.longitude.toString(),
      owner: repeater.owner || '',
    }));
    setFoundRepeater(repeater);
  }, []);

  // Look up repeater when existingCallsign changes
  React.useEffect(() => {
    if (formData.type === 'new' || !formData.existingCallsign.trim()) {
      setFoundRepeater(null);
      return;
    }

    const callsignUpper = formData.existingCallsign.trim().toUpperCase();
    const found = repeaters.find((r) => r.callsign.toUpperCase() === callsignUpper);

    if (found) {
      populateFromRepeater(found);
    } else {
      setFoundRepeater(null);
    }
  }, [formData.existingCallsign, formData.type, repeaters, populateFromRepeater]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(resetForm, 200);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.callsign.trim() || formData.callsign.trim().length < 3) {
      newErrors.callsign = t('errors.callsignRequired');
    }

    const outFreq = parseFloat(formData.outputFrequency);
    if (isNaN(outFreq) || outFreq <= 0) {
      newErrors.outputFrequency = t('errors.outputFrequencyRequired');
    }

    const inFreq = parseFloat(formData.inputFrequency);
    if (isNaN(inFreq) || inFreq <= 0) {
      newErrors.inputFrequency = t('errors.inputFrequencyRequired');
    }

    const lat = parseFloat(formData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = t('errors.latitudeRequired');
    }

    const lon = parseFloat(formData.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      newErrors.longitude = t('errors.longitudeRequired');
    }

    if (!formData.modulation) {
      newErrors.modulation = t('errors.modulationRequired');
    }

    if (formData.tone) {
      const toneVal = parseFloat(formData.tone);
      if (isNaN(toneVal) || toneVal <= 0) {
        newErrors.tone = t('errors.invalidTone');
      }
    }

    if ((formData.type === 'correction' || formData.type === 'status') && !formData.existingCallsign.trim()) {
      newErrors.existingCallsign = t('errors.existingCallsignRequired');
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
      const response = await fetch(`${API_BASE_URL}/api/repeaters/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          existingCallsign: formData.type !== 'new' ? formData.existingCallsign.trim() : undefined,
          callsign: formData.callsign.trim(),
          outputFrequency: parseFloat(formData.outputFrequency),
          inputFrequency: parseFloat(formData.inputFrequency),
          tone: formData.tone ? parseFloat(formData.tone) : undefined,
          modulation: formData.modulation,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          owner: formData.owner.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          submitterEmail: formData.submitterEmail.trim() || undefined,
          submitterCallsign: formData.submitterCallsign.trim() || undefined,
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

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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

            {/* Submission Type */}
            <div className="space-y-2">
              <Label htmlFor="type">{t('fields.type')}</Label>
              <Select value={formData.type} onValueChange={(value) => updateField('type', value as FormData['type'])}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('types.new')}</SelectItem>
                  <SelectItem value="correction">{t('types.correction')}</SelectItem>
                  <SelectItem value="status">{t('types.status')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Existing Callsign (for corrections/status updates) */}
            {(formData.type === 'correction' || formData.type === 'status') && (
              <div className="space-y-2">
                <Label htmlFor="existingCallsign">
                  {t('fields.existingCallsign')} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="existingCallsign"
                    value={formData.existingCallsign}
                    onChange={(e) => updateField('existingCallsign', e.target.value.toUpperCase())}
                    placeholder={t('placeholders.existingCallsign')}
                    aria-invalid={!!errors.existingCallsign}
                    className={foundRepeater ? 'pr-8 border-green-500 focus-visible:ring-green-500' : ''}
                  />
                  {foundRepeater && (
                    <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {foundRepeater && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t('repeaterFound')}
                  </p>
                )}
                {errors.existingCallsign && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.existingCallsign}
                  </p>
                )}
              </div>
            )}

            {/* Callsign */}
            <div className="space-y-2">
              <Label htmlFor="callsign">
                {t('fields.callsign')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="callsign"
                value={formData.callsign}
                onChange={(e) => updateField('callsign', e.target.value.toUpperCase())}
                placeholder={t('placeholders.callsign')}
                aria-invalid={!!errors.callsign}
              />
              {errors.callsign && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.callsign}
                </p>
              )}
            </div>

            {/* Frequencies */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outputFrequency">
                  {t('fields.outputFrequency')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="outputFrequency"
                  type="number"
                  step="0.0001"
                  value={formData.outputFrequency}
                  onChange={(e) => updateField('outputFrequency', e.target.value)}
                  placeholder={t('placeholders.outputFrequency')}
                  aria-invalid={!!errors.outputFrequency}
                />
                {errors.outputFrequency && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.outputFrequency}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inputFrequency">
                  {t('fields.inputFrequency')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="inputFrequency"
                  type="number"
                  step="0.0001"
                  value={formData.inputFrequency}
                  onChange={(e) => updateField('inputFrequency', e.target.value)}
                  placeholder={t('placeholders.inputFrequency')}
                  aria-invalid={!!errors.inputFrequency}
                />
                {errors.inputFrequency && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.inputFrequency}
                  </p>
                )}
              </div>
            </div>

            {/* Tone and Modulation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">{t('fields.tone')}</Label>
                <Input
                  id="tone"
                  type="number"
                  step="0.1"
                  value={formData.tone}
                  onChange={(e) => updateField('tone', e.target.value)}
                  placeholder={t('placeholders.tone')}
                  aria-invalid={!!errors.tone}
                />
                {errors.tone && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.tone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="modulation">
                  {t('fields.modulation')} <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.modulation} onValueChange={(value) => updateField('modulation', value)}>
                  <SelectTrigger id="modulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FM">FM</SelectItem>
                    <SelectItem value="DMR">DMR</SelectItem>
                    <SelectItem value="D-STAR">D-STAR</SelectItem>
                    <SelectItem value="DMR / D-STAR">DMR / D-STAR</SelectItem>
                    <SelectItem value="C4FM">C4FM</SelectItem>
                    <SelectItem value="TETRA">TETRA</SelectItem>
                  </SelectContent>
                </Select>
                {errors.modulation && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.modulation}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('fields.latitude')} / {t('fields.longitude')} <span className="text-destructive">*</span></Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="h-7 text-xs"
                >
                  {isLocating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3 mr-1" />
                  )}
                  {t('useLocation')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => updateField('latitude', e.target.value)}
                    placeholder="38.7223"
                    aria-invalid={!!errors.latitude}
                  />
                  {errors.latitude && (
                    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {errors.latitude}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => updateField('longitude', e.target.value)}
                    placeholder="-9.1393"
                    aria-invalid={!!errors.longitude}
                  />
                  {errors.longitude && (
                    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {errors.longitude}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label htmlFor="owner">{t('fields.owner')}</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => updateField('owner', e.target.value)}
                placeholder={t('placeholders.owner')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder={t('placeholders.notes')}
                rows={3}
              />
            </div>

            {/* Submitter Info */}
            <div className="grid grid-cols-2 gap-4">
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
                {errors.submitterEmail && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.submitterEmail}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="submitterCallsign">{t('fields.submitterCallsign')}</Label>
                <Input
                  id="submitterCallsign"
                  value={formData.submitterCallsign}
                  onChange={(e) => updateField('submitterCallsign', e.target.value.toUpperCase())}
                  placeholder={t('placeholders.submitterCallsign')}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('emailNote')}</p>

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
