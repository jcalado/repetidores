'use client';

import { type Repeater } from '@/app/columns';
import { getPrimaryFrequency } from '@/types/repeater-helpers';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Loader2, MapPin, PenLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface RepeaterSubmitDialogProps {
  repeaters?: Repeater[];
}

type RepeaterMode = 'FM' | 'DMR' | 'DSTAR' | 'C4FM' | 'TETRA' | 'Digipeater';

interface FormData {
  // Basic
  type: 'new' | 'correction';
  existingCallsign: string;
  callsign: string;
  modes: RepeaterMode[];

  // Frequencies
  outputFrequency: string;
  inputFrequency: string;
  tone: string;
  fmBandwidth: 'narrow' | 'wide' | '';

  // Location
  latitude: string;
  longitude: string;
  address: string;

  // DMR Config
  dmrColorCode: string;
  dmrId: string;
  dmrNetwork: string;

  // D-STAR Config
  dstarModule: 'A' | 'B' | 'C' | 'D' | '';
  dstarReflector: string;

  // C4FM Config
  c4fmNetwork: 'wires-x' | 'ysf' | 'other' | '';
  c4fmNode: string;
  c4fmRoom: string;

  // EchoLink Config
  echolinkEnabled: boolean;
  echolinkNodeNumber: string;
  echolinkConference: string;

  // AllStar Config
  allstarEnabled: boolean;
  allstarNodeNumber: string;

  // Technical
  power: string;
  antennaHeight: string;
  coverage: 'local' | 'regional' | 'wide' | '';
  operatingHours: string;
  notes: string;
  website: string;

  // Ownership
  owner: string;
  submitterEmail: string;
  submitterCallsign: string;

  // Spam protection
  honeypot: string;
}

interface FormErrors {
  callsign?: string;
  outputFrequency?: string;
  inputFrequency?: string;
  tone?: string;
  modes?: string;
  latitude?: string;
  longitude?: string;
  existingCallsign?: string;
  submitterEmail?: string;
  website?: string;
  dmrColorCode?: string;
}

const API_BASE_URL = (() => {
  const source =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
      : process.env.PAYLOAD_API_BASE_URL || process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000';
  return source.replace(/\/$/, '');
})();

const INITIAL_FORM_DATA: FormData = {
  type: 'new',
  existingCallsign: '',
  callsign: '',
  modes: [],
  outputFrequency: '',
  inputFrequency: '',
  tone: '',
  fmBandwidth: '',
  latitude: '',
  longitude: '',
  address: '',
  dmrColorCode: '',
  dmrId: '',
  dmrNetwork: '',
  dstarModule: '',
  dstarReflector: '',
  c4fmNetwork: '',
  c4fmNode: '',
  c4fmRoom: '',
  echolinkEnabled: false,
  echolinkNodeNumber: '',
  echolinkConference: '',
  allstarEnabled: false,
  allstarNodeNumber: '',
  power: '',
  antennaHeight: '',
  coverage: '',
  operatingHours: '',
  notes: '',
  website: '',
  owner: '',
  submitterEmail: '',
  submitterCallsign: '',
  honeypot: '',
};

const MODE_OPTIONS: { value: RepeaterMode; label: string }[] = [
  { value: 'FM', label: 'FM' },
  { value: 'DMR', label: 'DMR' },
  { value: 'DSTAR', label: 'D-STAR' },
  { value: 'C4FM', label: 'C4FM / Fusion' },
  { value: 'TETRA', label: 'TETRA' },
  { value: 'Digipeater', label: 'Digipeater' },
];

export default function RepeaterSubmitDialog({ repeaters = [] }: RepeaterSubmitDialogProps) {
  const t = useTranslations('repeaterSubmit');
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('basic');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isLocating, setIsLocating] = React.useState(false);
  const [foundRepeater, setFoundRepeater] = React.useState<Repeater | null>(null);
  const [formData, setFormData] = React.useState<FormData>(INITIAL_FORM_DATA);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setSubmitStatus('idle');
    setErrorMessage('');
    setFoundRepeater(null);
    setActiveTab('basic');
  };

  // Populate form with existing repeater data
  const populateFromRepeater = React.useCallback((repeater: Repeater) => {
    const primary = getPrimaryFrequency(repeater);
    setFormData((prev) => ({
      ...prev,
      callsign: repeater.callsign,
      modes: (repeater.modes || []) as RepeaterMode[],
      outputFrequency: primary?.outputFrequency?.toString() || '',
      inputFrequency: primary?.inputFrequency?.toString() || '',
      tone: primary?.tone ? primary.tone.toString() : '',
      latitude: repeater.latitude?.toString() || '',
      longitude: repeater.longitude?.toString() || '',
      address: repeater.address || '',
      owner: repeater.owner || '',
      // DMR
      dmrColorCode: repeater.dmr?.colorCode?.toString() || '',
      dmrId: repeater.dmr?.dmrId?.toString() || '',
      dmrNetwork: repeater.dmr?.network || '',
      // D-STAR
      dstarModule: repeater.dstar?.module || '',
      dstarReflector: repeater.dstar?.reflector || '',
      // C4FM
      c4fmNetwork: repeater.c4fm?.network || '',
      c4fmNode: repeater.c4fm?.node || '',
      c4fmRoom: repeater.c4fm?.room || '',
      // EchoLink
      echolinkEnabled: repeater.echolink?.enabled || false,
      echolinkNodeNumber: repeater.echolink?.nodeNumber?.toString() || '',
      echolinkConference: repeater.echolink?.conference || '',
      // AllStar
      allstarEnabled: !!repeater.allstarNode,
      allstarNodeNumber: repeater.allstarNode?.toString() || '',
      // Technical
      power: repeater.power?.toString() || '',
      antennaHeight: repeater.antennaHeight?.toString() || '',
      coverage: repeater.coverage || '',
      operatingHours: repeater.operatingHours || '',
      notes: repeater.notes || '',
      website: repeater.website || '',
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

    if (formData.modes.length === 0) {
      newErrors.modes = t('errors.modesRequired');
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

    if (formData.tone) {
      const toneVal = parseFloat(formData.tone);
      if (isNaN(toneVal) || toneVal <= 0) {
        newErrors.tone = t('errors.invalidTone');
      }
    }

    if (formData.type === 'correction' && !formData.existingCallsign.trim()) {
      newErrors.existingCallsign = t('errors.existingCallsignRequired');
    }

    if (formData.submitterEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.submitterEmail)) {
        newErrors.submitterEmail = t('errors.invalidEmail');
      }
    }

    if (formData.website) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = t('errors.invalidUrl');
      }
    }

    if (formData.modes.includes('DMR') && formData.dmrColorCode) {
      const cc = parseInt(formData.dmrColorCode);
      if (isNaN(cc) || cc < 1 || cc > 15) {
        newErrors.dmrColorCode = t('errors.invalidColorCode');
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
      const payload: Record<string, unknown> = {
        type: formData.type,
        existingCallsign: formData.type !== 'new' ? formData.existingCallsign.trim() : undefined,
        callsign: formData.callsign.trim(),
        modes: formData.modes,
        outputFrequency: parseFloat(formData.outputFrequency),
        inputFrequency: parseFloat(formData.inputFrequency),
        tone: formData.tone ? parseFloat(formData.tone) : undefined,
        fmBandwidth: formData.fmBandwidth || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address.trim() || undefined,
        owner: formData.owner.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        website: formData.website.trim() || undefined,
        power: formData.power ? parseFloat(formData.power) : undefined,
        antennaHeight: formData.antennaHeight ? parseFloat(formData.antennaHeight) : undefined,
        coverage: formData.coverage || undefined,
        operatingHours: formData.operatingHours.trim() || undefined,
        submitterEmail: formData.submitterEmail.trim() || undefined,
        submitterCallsign: formData.submitterCallsign.trim() || undefined,
        honeypot: formData.honeypot,
      };

      // Add DMR config if DMR mode selected
      if (formData.modes.includes('DMR') && (formData.dmrColorCode || formData.dmrId || formData.dmrNetwork)) {
        payload.dmrConfig = {
          colorCode: formData.dmrColorCode ? parseInt(formData.dmrColorCode) : undefined,
          dmrId: formData.dmrId ? parseInt(formData.dmrId) : undefined,
          network: formData.dmrNetwork || undefined,
        };
      }

      // Add D-STAR config if D-STAR mode selected
      if (formData.modes.includes('DSTAR') && (formData.dstarModule || formData.dstarReflector)) {
        payload.dstarConfig = {
          module: formData.dstarModule || undefined,
          reflector: formData.dstarReflector || undefined,
        };
      }

      // Add C4FM config if C4FM mode selected
      if (formData.modes.includes('C4FM') && (formData.c4fmNetwork || formData.c4fmNode || formData.c4fmRoom)) {
        payload.c4fmConfig = {
          network: formData.c4fmNetwork || undefined,
          node: formData.c4fmNode || undefined,
          room: formData.c4fmRoom || undefined,
        };
      }

      // Add EchoLink config
      if (formData.echolinkEnabled) {
        payload.echolinkConfig = {
          enabled: true,
          nodeNumber: formData.echolinkNodeNumber ? parseInt(formData.echolinkNodeNumber) : undefined,
          conference: formData.echolinkConference || undefined,
        };
      }

      // Add AllStar config
      if (formData.allstarEnabled && formData.allstarNodeNumber) {
        payload.allstarConfig = {
          enabled: true,
          nodeNumber: parseInt(formData.allstarNodeNumber),
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/repeaters/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleMode = (mode: RepeaterMode) => {
    setFormData((prev) => ({
      ...prev,
      modes: prev.modes.includes(mode)
        ? prev.modes.filter((m) => m !== mode)
        : [...prev.modes, mode],
    }));
    if (errors.modes) {
      setErrors((prev) => ({ ...prev, modes: undefined }));
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

  const hasDMR = formData.modes.includes('DMR');
  const hasDSTAR = formData.modes.includes('DSTAR');
  const hasC4FM = formData.modes.includes('C4FM');
  const hasFM = formData.modes.includes('FM');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PenLine className="h-4 w-4" />
          {t('button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] h-[80vh] max-h-[700px] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 flex-1">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center font-medium">{t('successMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="grid w-full grid-cols-6 mb-4 flex-shrink-0">
                <TabsTrigger value="basic" className="text-xs px-1">{t('tabs.basic')}</TabsTrigger>
                <TabsTrigger value="frequency" className="text-xs px-1">{t('tabs.frequency')}</TabsTrigger>
                <TabsTrigger value="location" className="text-xs px-1">{t('tabs.location')}</TabsTrigger>
                <TabsTrigger value="digital" className="text-xs px-1">{t('tabs.digital')}</TabsTrigger>
                <TabsTrigger value="technical" className="text-xs px-1">{t('tabs.technical')}</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs px-1">{t('tabs.contact')}</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                    </SelectContent>
                  </Select>
                </div>

                {/* Existing Callsign (for corrections) */}
                {formData.type === 'correction' && (
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

                {/* Modes */}
                <div className="space-y-2">
                  <Label>
                    {t('fields.modes')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MODE_OPTIONS.map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mode-${value}`}
                          checked={formData.modes.includes(value)}
                          onCheckedChange={() => toggleMode(value)}
                        />
                        <Label htmlFor={`mode-${value}`} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.modes && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.modes}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Frequency Tab */}
              <TabsContent value="frequency" className="flex-1 overflow-y-auto space-y-4 pr-2">
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

                  {hasFM && (
                    <div className="space-y-2">
                      <Label htmlFor="fmBandwidth">{t('fields.fmBandwidth')}</Label>
                      <Select value={formData.fmBandwidth} onValueChange={(value) => updateField('fmBandwidth', value as FormData['fmBandwidth'])}>
                        <SelectTrigger id="fmBandwidth">
                          <SelectValue placeholder={t('placeholders.select')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="narrow">{t('options.narrow')}</SelectItem>
                          <SelectItem value="wide">{t('options.wide')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('fields.coordinates')} <span className="text-destructive">*</span></Label>
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

                <div className="space-y-2">
                  <Label htmlFor="address">{t('fields.address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder={t('placeholders.address')}
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* Digital Config Tab */}
              <TabsContent value="digital" className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* DMR Configuration */}
                {hasDMR && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="font-medium text-sm">DMR</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="dmrColorCode" className="text-xs">{t('fields.dmrColorCode')}</Label>
                        <Input
                          id="dmrColorCode"
                          type="number"
                          min="1"
                          max="15"
                          value={formData.dmrColorCode}
                          onChange={(e) => updateField('dmrColorCode', e.target.value)}
                          placeholder="1-15"
                          aria-invalid={!!errors.dmrColorCode}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dmrId" className="text-xs">{t('fields.dmrId')}</Label>
                        <Input
                          id="dmrId"
                          type="number"
                          value={formData.dmrId}
                          onChange={(e) => updateField('dmrId', e.target.value)}
                          placeholder="DMR ID"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dmrNetwork" className="text-xs">{t('fields.dmrNetwork')}</Label>
                        <Input
                          id="dmrNetwork"
                          value={formData.dmrNetwork}
                          onChange={(e) => updateField('dmrNetwork', e.target.value)}
                          placeholder="Brandmeister..."
                        />
                      </div>
                    </div>
                    {errors.dmrColorCode && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.dmrColorCode}
                      </p>
                    )}
                  </div>
                )}

                {/* D-STAR Configuration */}
                {hasDSTAR && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="font-medium text-sm">D-STAR</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="dstarModule" className="text-xs">{t('fields.dstarModule')}</Label>
                        <Select value={formData.dstarModule} onValueChange={(value) => updateField('dstarModule', value as FormData['dstarModule'])}>
                          <SelectTrigger id="dstarModule">
                            <SelectValue placeholder={t('placeholders.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A (23cm)</SelectItem>
                            <SelectItem value="B">B (70cm)</SelectItem>
                            <SelectItem value="C">C (2m)</SelectItem>
                            <SelectItem value="D">D (Data)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dstarReflector" className="text-xs">{t('fields.dstarReflector')}</Label>
                        <Input
                          id="dstarReflector"
                          value={formData.dstarReflector}
                          onChange={(e) => updateField('dstarReflector', e.target.value)}
                          placeholder="REF001, XLX268..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* C4FM Configuration */}
                {hasC4FM && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="font-medium text-sm">C4FM / Fusion</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="c4fmNetwork" className="text-xs">{t('fields.c4fmNetwork')}</Label>
                        <Select value={formData.c4fmNetwork} onValueChange={(value) => updateField('c4fmNetwork', value as FormData['c4fmNetwork'])}>
                          <SelectTrigger id="c4fmNetwork">
                            <SelectValue placeholder={t('placeholders.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wires-x">Wires-X</SelectItem>
                            <SelectItem value="ysf">YSF</SelectItem>
                            <SelectItem value="other">{t('options.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="c4fmNode" className="text-xs">{t('fields.c4fmNode')}</Label>
                        <Input
                          id="c4fmNode"
                          value={formData.c4fmNode}
                          onChange={(e) => updateField('c4fmNode', e.target.value)}
                          placeholder="Node"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="c4fmRoom" className="text-xs">{t('fields.c4fmRoom')}</Label>
                        <Input
                          id="c4fmRoom"
                          value={formData.c4fmRoom}
                          onChange={(e) => updateField('c4fmRoom', e.target.value)}
                          placeholder="Room"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* EchoLink Configuration */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="echolinkEnabled"
                      checked={formData.echolinkEnabled}
                      onCheckedChange={(checked) => updateField('echolinkEnabled', checked === true)}
                    />
                    <Label htmlFor="echolinkEnabled" className="font-medium text-sm cursor-pointer">EchoLink</Label>
                  </div>
                  {formData.echolinkEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="echolinkNodeNumber" className="text-xs">{t('fields.echolinkNode')}</Label>
                        <Input
                          id="echolinkNodeNumber"
                          type="number"
                          value={formData.echolinkNodeNumber}
                          onChange={(e) => updateField('echolinkNodeNumber', e.target.value)}
                          placeholder="Node number"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="echolinkConference" className="text-xs">{t('fields.echolinkConference')}</Label>
                        <Input
                          id="echolinkConference"
                          value={formData.echolinkConference}
                          onChange={(e) => updateField('echolinkConference', e.target.value)}
                          placeholder="*PORTUGAL*..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* AllStar Configuration */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allstarEnabled"
                      checked={formData.allstarEnabled}
                      onCheckedChange={(checked) => updateField('allstarEnabled', checked === true)}
                    />
                    <Label htmlFor="allstarEnabled" className="font-medium text-sm cursor-pointer">AllStar</Label>
                  </div>
                  {formData.allstarEnabled && (
                    <div className="space-y-1">
                      <Label htmlFor="allstarNodeNumber" className="text-xs">{t('fields.allstarNode')}</Label>
                      <Input
                        id="allstarNodeNumber"
                        type="number"
                        value={formData.allstarNodeNumber}
                        onChange={(e) => updateField('allstarNodeNumber', e.target.value)}
                        placeholder="Node number"
                      />
                    </div>
                  )}
                </div>

                {!hasDMR && !hasDSTAR && !hasC4FM && !formData.echolinkEnabled && !formData.allstarEnabled && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('noDigitalModes')}
                  </p>
                )}
              </TabsContent>

              {/* Technical Tab */}
              <TabsContent value="technical" className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="power">{t('fields.power')}</Label>
                    <Input
                      id="power"
                      type="number"
                      value={formData.power}
                      onChange={(e) => updateField('power', e.target.value)}
                      placeholder="W"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="antennaHeight">{t('fields.antennaHeight')}</Label>
                    <Input
                      id="antennaHeight"
                      type="number"
                      value={formData.antennaHeight}
                      onChange={(e) => updateField('antennaHeight', e.target.value)}
                      placeholder="m AGL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverage">{t('fields.coverage')}</Label>
                    <Select value={formData.coverage} onValueChange={(value) => updateField('coverage', value as FormData['coverage'])}>
                      <SelectTrigger id="coverage">
                        <SelectValue placeholder={t('placeholders.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">{t('options.local')}</SelectItem>
                        <SelectItem value="regional">{t('options.regional')}</SelectItem>
                        <SelectItem value="wide">{t('options.wide')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingHours">{t('fields.operatingHours')}</Label>
                  <Input
                    id="operatingHours"
                    value={formData.operatingHours}
                    onChange={(e) => updateField('operatingHours', e.target.value)}
                    placeholder={t('placeholders.operatingHours')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{t('fields.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://..."
                    aria-invalid={!!errors.website}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.website}
                    </p>
                  )}
                </div>

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
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="space-y-2">
                  <Label htmlFor="owner">{t('fields.owner')}</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => updateField('owner', e.target.value)}
                    placeholder={t('placeholders.owner')}
                  />
                </div>

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
              </TabsContent>
            </Tabs>

            {submitStatus === 'error' && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 mt-4 flex-shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <DialogFooter className="pt-4 mt-4 border-t flex-shrink-0">
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
