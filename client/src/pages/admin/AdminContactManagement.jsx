import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { contactService } from '../../services/contactService';
import { useContactInfo } from '../../context/ContactContext';
import { GOOGLE_MAPS_SEARCH_URL } from '../../constants/contact';

function generateLocalId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminContactManagement() {
  const { refreshContactInfo } = useContactInfo();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('phones');

  // Master Contact Form State
  const [companyName, setCompanyName] = useState('Sriyas Healthcare Private Limited');
  const [tagline, setTagline] = useState('Empowering Healthcare with Care and Innovation.');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 13.0458, lng: 80.1472 });

  const [phones, setPhones] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);
  const [emails, setEmails] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    workingDays: 'Monday – Saturday',
    openingTime: '9:00 AM',
    closingTime: '6:30 PM',
    specialDays: 'Sunday: Closed / Emergency Hospital Dispatch',
    holidays: 'Closed on Public & National Holidays',
    temporaryClosureMessage: '',
    isActive: true
  });
  const [registrations, setRegistrations] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [officeImages, setOfficeImages] = useState([]);

  // Modal Dialog States
  const [modalType, setModalType] = useState(null); // 'phone' | 'whatsapp' | 'email' | 'address' | 'registration' | 'social' | 'image'
  const [editingItem, setEditingItem] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, title }

  // Upload Photo State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    document.title = 'Contact Information Management | Sriyas Healthcare Admin';
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await contactService.getAdminContactInfo();
      if (res && res.success && res.contact) {
        const c = res.contact;
        setCompanyName(c.companyName || 'Sriyas Healthcare Private Limited');
        setTagline(c.tagline || 'Empowering Healthcare with Care and Innovation.');
        setGoogleMapsUrl(
          c.googleMapsUrl && !c.googleMapsUrl.includes('H981BLR5kQ2Yz1Sr7')
            ? c.googleMapsUrl
            : GOOGLE_MAPS_SEARCH_URL
        );
        setMapCoordinates(c.mapCoordinates || { lat: 13.0458, lng: 80.1472 });
        setPhones(Array.isArray(c.phones) ? c.phones : []);
        setWhatsapps(Array.isArray(c.whatsapps) ? c.whatsapps : []);
        setEmails(Array.isArray(c.emails) ? c.emails : []);
        setAddresses(Array.isArray(c.addresses) ? c.addresses : []);
        if (c.workingHours && typeof c.workingHours === 'object') {
          setWorkingHours({
            workingDays: c.workingHours.workingDays || 'Monday – Saturday',
            openingTime: c.workingHours.openingTime || '9:00 AM',
            closingTime: c.workingHours.closingTime || '6:30 PM',
            specialDays: c.workingHours.specialDays || '',
            holidays: c.workingHours.holidays || '',
            temporaryClosureMessage: c.workingHours.temporaryClosureMessage || '',
            isActive: c.workingHours.isActive !== false
          });
        }
        setRegistrations(Array.isArray(c.registrations) ? c.registrations : []);
        setSocialLinks(Array.isArray(c.socialLinks) ? c.socialLinks : []);
        setOfficeImages(Array.isArray(c.officeImages) ? c.officeImages : []);
        setHasChanges(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load contact information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markChanged = () => {
    setHasChanges(true);
    setSuccessMsg('');
  };

  // ═══════════════════════════════════════════════════════════
  // SAVE MASTER CHANGES
  // ═══════════════════════════════════════════════════════════
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        companyName,
        tagline,
        googleMapsUrl,
        mapCoordinates,
        phones,
        whatsapps,
        emails,
        addresses,
        workingHours,
        registrations,
        socialLinks,
        officeImages
      };

      const res = await contactService.updateContactInfo(payload);
      if (res && res.success) {
        setSuccessMsg('✓ Contact information successfully saved to MongoDB Atlas. Public website synchronized!');
        setHasChanges(false);
        await refreshContactInfo();
        window.dispatchEvent(new CustomEvent('sriyas:contact-updated'));
      } else {
        setError(res?.message || 'Could not save contact information.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving contact information to server.');
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // PRIMARY TOGGLES
  // ═══════════════════════════════════════════════════════════
  const setPrimaryItem = (category, id) => {
    markChanged();
    if (category === 'phone') {
      setPhones(prev => prev.map(p => ({ ...p, isPrimary: p.id === id })));
    } else if (category === 'whatsapp') {
      setWhatsapps(prev => prev.map(w => ({ ...w, isPrimary: w.id === id })));
    } else if (category === 'email') {
      setEmails(prev => prev.map(e => ({ ...e, isPrimary: e.id === id })));
    } else if (category === 'address') {
      setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === id })));
    } else if (category === 'image') {
      setOfficeImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })));
    }
  };

  const toggleItemActive = (category, id) => {
    markChanged();
    if (category === 'phone') {
      setPhones(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    } else if (category === 'whatsapp') {
      setWhatsapps(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    } else if (category === 'email') {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
    } else if (category === 'address') {
      setAddresses(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    } else if (category === 'registration') {
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    } else if (category === 'social') {
      setSocialLinks(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    }
  };

  // Reordering helpers
  const moveItem = (category, index, direction) => {
    markChanged();
    const updater = (prev) => {
      const copy = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    };

    if (category === 'phone') setPhones(updater);
    else if (category === 'whatsapp') setWhatsapps(updater);
    else if (category === 'email') setEmails(updater);
    else if (category === 'address') setAddresses(updater);
    else if (category === 'registration') setRegistrations(updater);
    else if (category === 'social') setSocialLinks(updater);
    else if (category === 'image') setOfficeImages(updater);
  };

  // Statutory resolution helpers
  const gstinValue = useMemo(() => {
    const reg = registrations.find(r => r.label?.toUpperCase().includes('GST') || r.id === 'reg-gstin');
    return reg?.value || '33ABQCS4744P1ZJ';
  }, [registrations]);

  const dl1Value = useMemo(() => {
    const r1 = registrations.find(r => r.id === 'reg-dl-1' || r.label?.includes('20B') || r.label?.includes('DL 1'));
    if (r1?.value) return r1.value;
    const rComb = registrations.find(r => r.id === 'reg-dl' || r.label?.toUpperCase().includes('DRUG'));
    if (rComb?.value) {
      return rComb.value.split('&')[0]?.trim() || 'TN/Z04/20B/01443';
    }
    return 'TN/Z04/20B/01443';
  }, [registrations]);

  const dl2Value = useMemo(() => {
    const r2 = registrations.find(r => r.id === 'reg-dl-2' || r.label?.includes('21B') || r.label?.includes('DL 2'));
    if (r2?.value) return r2.value;
    const rComb = registrations.find(r => r.id === 'reg-dl' || r.label?.toUpperCase().includes('DRUG'));
    if (rComb?.value) {
      return rComb.value.split('&')[1]?.trim() || 'TN/Z04/21B/01443';
    }
    return 'TN/Z04/21B/01443';
  }, [registrations]);

  const updateMainOfficePhone = (index, field, value) => {
    markChanged();
    setPhones(prev => {
      const list = [...prev];
      while (list.length < 2) {
        list.push({
          id: generateLocalId('phone'),
          label: 'Main Office',
          countryCode: '+91',
          number: list.length === 0 ? '9600804456' : '9367772801',
          purpose: list.length === 0 ? 'General & Institutional Enquiries' : 'General Enquiries',
          displayOrder: list.length + 1,
          isActive: true,
          isPrimary: list.length === 0,
          showOnContactPage: true,
          showInFooter: true,
          enableClickToCall: true
        });
      }
      list[index] = {
        ...list[index],
        [field]: value
      };
      return list;
    });
  };

  const primaryEmailItem = useMemo(() => {
    return emails.find(e => e.isPrimary) || emails[0] || {
      id: 'email-main',
      label: 'Official Email',
      email: 'sriyashealthcare@gmail.com',
      department: 'Corporate & Institutional Correspondence',
      isPrimary: true,
      isActive: true,
      showOnContactPage: true,
      showInFooter: true,
      enableMailto: true,
      displayOrder: 1
    };
  }, [emails]);

  const updatePrimaryEmail = (field, value) => {
    markChanged();
    setEmails(prev => {
      const list = [...prev];
      if (list.length === 0) {
        list.push({
          id: generateLocalId('email'),
          label: 'Official Email',
          email: 'sriyashealthcare@gmail.com',
          department: 'Corporate & Institutional Correspondence',
          isPrimary: true,
          isActive: true,
          showOnContactPage: true,
          showInFooter: true,
          enableMailto: true,
          displayOrder: 1
        });
      }
      let pIdx = list.findIndex(e => e.isPrimary);
      if (pIdx === -1) pIdx = 0;
      list[pIdx] = {
        ...list[pIdx],
        [field]: value
      };
      return list;
    });
  };

  const updateStatutoryRegistration = (type, val) => {
    markChanged();
    setRegistrations(prev => {
      let copy = [...prev];
      if (type === 'gstin') {
        const idx = copy.findIndex(r => r.label?.toUpperCase().includes('GST') || r.id === 'reg-gstin');
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], value: val.trim() };
        } else {
          copy.push({
            id: 'reg-gstin',
            label: 'GSTIN',
            value: val.trim(),
            displayLocation: 'both',
            isActive: true,
            displayOrder: 1
          });
        }
      } else if (type === 'dl1' || type === 'dl2') {
        const dl1Idx = copy.findIndex(r => r.id === 'reg-dl-1' || r.label?.includes('20B') || r.label?.includes('DL 1'));
        const dl2Idx = copy.findIndex(r => r.id === 'reg-dl-2' || r.label?.includes('21B') || r.label?.includes('DL 2'));
        const dlCombinedIdx = copy.findIndex(r => r.id === 'reg-dl' || r.label?.toUpperCase().includes('DRUG'));

        let currentDl1 = dl1Idx >= 0 ? copy[dl1Idx].value : 'TN/Z04/20B/01443';
        let currentDl2 = dl2Idx >= 0 ? copy[dl2Idx].value : 'TN/Z04/21B/01443';

        if (dlCombinedIdx >= 0 && dl1Idx < 0 && dl2Idx < 0) {
          const parts = copy[dlCombinedIdx].value.split('&').map(s => s.trim());
          currentDl1 = parts[0] || currentDl1;
          currentDl2 = parts[1] || currentDl2;
        }

        const newDl1 = type === 'dl1' ? val.trim() : currentDl1;
        const newDl2 = type === 'dl2' ? val.trim() : currentDl2;

        if (dl1Idx >= 0) {
          copy[dl1Idx] = { ...copy[dl1Idx], value: newDl1 };
        } else {
          copy.push({
            id: 'reg-dl-1',
            label: 'Drug Licence 1',
            value: newDl1,
            displayLocation: 'contact_page',
            isActive: true,
            displayOrder: 2
          });
        }

        if (dl2Idx >= 0) {
          copy[dl2Idx] = { ...copy[dl2Idx], value: newDl2 };
        } else {
          copy.push({
            id: 'reg-dl-2',
            label: 'Drug Licence 2',
            value: newDl2,
            displayLocation: 'contact_page',
            isActive: true,
            displayOrder: 3
          });
        }

        const combinedVal = `${newDl1} & ${newDl2}`;
        if (dlCombinedIdx >= 0) {
          copy[dlCombinedIdx] = { ...copy[dlCombinedIdx], value: combinedVal };
        } else {
          copy.push({
            id: 'reg-dl',
            label: 'Drug Licence (DL) No',
            value: combinedVal,
            displayLocation: 'contact_page',
            isActive: true,
            displayOrder: 4
          });
        }
      }
      return copy;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════
  const openAddModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    setModalError('');

    if (type === 'phone') {
      setModalForm({
        label: '',
        countryCode: '+91',
        number: '',
        purpose: 'General Enquiries',
        isPrimary: phones.length === 0,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        enableClickToCall: true
      });
    } else if (type === 'whatsapp') {
      setModalForm({
        label: '',
        number: '',
        department: 'Customer & Product Support',
        prefilledMessage: 'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services.',
        isPrimary: whatsapps.length === 0,
        isActive: true,
        enableFloatingButton: true,
        showOnContactPage: true,
        showInFooter: false
      });
    } else if (type === 'email') {
      setModalForm({
        label: 'Official Email',
        email: '',
        department: 'Corporate & Institutional Correspondence',
        isPrimary: emails.length === 0,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        enableMailto: true
      });
    } else if (type === 'address') {
      setModalForm({
        officeName: '',
        officeType: 'Branch Office',
        line1: '',
        line2: '',
        area: '',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '',
        country: 'India',
        googleMapsUrl: '',
        isPrimary: addresses.length === 0,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true
      });
    } else if (type === 'registration') {
      setModalForm({
        label: '',
        value: '',
        displayLocation: 'both',
        isActive: true
      });
    } else if (type === 'social') {
      setModalForm({
        platform: 'linkedin',
        label: 'LinkedIn',
        url: '',
        isActive: true
      });
    } else if (type === 'image') {
      setModalForm({
        url: '',
        publicId: '',
        alt: '',
        caption: '',
        isPrimary: officeImages.length === 0
      });
    }
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setModalError('');
    setModalForm({ ...item });
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setModalError('');
    setModalForm({});
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    setModalError('');

    if (modalType === 'phone') {
      if (!modalForm.label?.trim() || !modalForm.number?.trim()) {
        setModalError('Display Label and Phone Number are required.');
        return;
      }
      markChanged();
      const cleanNum = modalForm.number.trim().replace(/[^0-9+]/g, '');
      const itemData = {
        ...modalForm,
        label: modalForm.label.trim(),
        number: cleanNum,
        countryCode: (modalForm.countryCode || '+91').trim(),
        purpose: (modalForm.purpose || '').trim()
      };

      if (editingItem) {
        setPhones(prev => prev.map(p => p.id === editingItem.id ? { ...p, ...itemData } : p));
      } else {
        const newPhone = {
          ...itemData,
          id: generateLocalId('phone'),
          displayOrder: phones.length + 1
        };
        if (newPhone.isPrimary) {
          setPhones(prev => [...prev.map(p => ({ ...p, isPrimary: false })), newPhone]);
        } else {
          setPhones(prev => [...prev, newPhone]);
        }
      }
    } else if (modalType === 'whatsapp') {
      if (!modalForm.label?.trim() || !modalForm.number?.trim()) {
        setModalError('Display Label and WhatsApp Number are required.');
        return;
      }
      markChanged();
      const cleanNum = modalForm.number.trim().replace(/[^0-9]/g, '');
      const itemData = {
        ...modalForm,
        label: modalForm.label.trim(),
        number: cleanNum,
        department: (modalForm.department || '').trim(),
        prefilledMessage: (modalForm.prefilledMessage || '').trim()
      };

      if (editingItem) {
        setWhatsapps(prev => prev.map(w => w.id === editingItem.id ? { ...w, ...itemData } : w));
      } else {
        const newWa = {
          ...itemData,
          id: generateLocalId('wa'),
          displayOrder: whatsapps.length + 1
        };
        if (newWa.isPrimary) {
          setWhatsapps(prev => [...prev.map(w => ({ ...w, isPrimary: false })), newWa]);
        } else {
          setWhatsapps(prev => [...prev, newWa]);
        }
      }
    } else if (modalType === 'email') {
      if (!modalForm.label?.trim() || !modalForm.email?.trim() || !modalForm.email.includes('@')) {
        setModalError('Please enter a valid Display Label and Email Address.');
        return;
      }
      markChanged();
      const itemData = {
        ...modalForm,
        label: modalForm.label.trim(),
        email: modalForm.email.trim().toLowerCase(),
        department: (modalForm.department || '').trim()
      };

      if (editingItem) {
        setEmails(prev => prev.map(e => e.id === editingItem.id ? { ...e, ...itemData } : e));
      } else {
        const newEmail = {
          ...itemData,
          id: generateLocalId('email'),
          displayOrder: emails.length + 1
        };
        if (newEmail.isPrimary) {
          setEmails(prev => [...prev.map(e => ({ ...e, isPrimary: false })), newEmail]);
        } else {
          setEmails(prev => [...prev, newEmail]);
        }
      }
    } else if (modalType === 'address') {
      if (!modalForm.officeName?.trim() || !modalForm.line1?.trim() || !modalForm.city?.trim() || !modalForm.pincode?.trim()) {
        setModalError('Office Name, Address Line 1, City, and PIN Code are required.');
        return;
      }
      markChanged();
      const itemData = {
        ...modalForm,
        officeName: modalForm.officeName.trim(),
        officeType: modalForm.officeType || 'Branch Office',
        line1: modalForm.line1.trim(),
        line2: (modalForm.line2 || '').trim(),
        area: (modalForm.area || '').trim(),
        city: modalForm.city.trim(),
        district: (modalForm.district || '').trim(),
        state: modalForm.state.trim(),
        pincode: modalForm.pincode.trim(),
        country: modalForm.country || 'India',
        googleMapsUrl: (modalForm.googleMapsUrl || '').trim()
      };

      if (editingItem) {
        setAddresses(prev => prev.map(a => a.id === editingItem.id ? { ...a, ...itemData } : a));
      } else {
        const newAddr = {
          ...itemData,
          id: generateLocalId('addr'),
          displayOrder: addresses.length + 1
        };
        if (newAddr.isPrimary) {
          setAddresses(prev => [...prev.map(a => ({ ...a, isPrimary: false })), newAddr]);
        } else {
          setAddresses(prev => [...prev, newAddr]);
        }
      }
    } else if (modalType === 'registration') {
      if (!modalForm.label?.trim() || !modalForm.value?.trim()) {
        setModalError('Registration Label and Value are required.');
        return;
      }
      markChanged();
      const itemData = {
        ...modalForm,
        label: modalForm.label.trim(),
        value: modalForm.value.trim(),
        displayLocation: modalForm.displayLocation || 'both'
      };

      if (editingItem) {
        setRegistrations(prev => prev.map(r => r.id === editingItem.id ? { ...r, ...itemData } : r));
      } else {
        const newReg = {
          ...itemData,
          id: generateLocalId('reg'),
          displayOrder: registrations.length + 1
        };
        setRegistrations(prev => [...prev, newReg]);
      }
    } else if (modalType === 'social') {
      if (!modalForm.label?.trim() || !modalForm.url?.trim()) {
        setModalError('Display Label and Profile URL are required.');
        return;
      }
      markChanged();
      const itemData = {
        ...modalForm,
        platform: modalForm.platform || 'custom',
        label: modalForm.label.trim(),
        url: modalForm.url.trim()
      };

      if (editingItem) {
        setSocialLinks(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...itemData } : s));
      } else {
        const newSoc = {
          ...itemData,
          id: generateLocalId('soc'),
          displayOrder: socialLinks.length + 1
        };
        setSocialLinks(prev => [...prev, newSoc]);
      }
    } else if (modalType === 'image') {
      if (!modalForm.url?.trim()) {
        setModalError('Image URL or Uploaded photo is required.');
        return;
      }
      markChanged();
      const itemData = {
        ...modalForm,
        url: modalForm.url.trim(),
        publicId: (modalForm.publicId || '').trim(),
        alt: (modalForm.alt || '').trim(),
        caption: (modalForm.caption || '').trim()
      };

      if (editingItem) {
        setOfficeImages(prev => prev.map(img => img.id === editingItem.id ? { ...img, ...itemData } : img));
      } else {
        const newImg = {
          ...itemData,
          id: generateLocalId('img'),
          displayOrder: officeImages.length + 1
        };
        if (newImg.isPrimary) {
          setOfficeImages(prev => [...prev.map(img => ({ ...img, isPrimary: false })), newImg]);
        } else {
          setOfficeImages(prev => [...prev, newImg]);
        }
      }
    }

    closeModal();
  };

  // ═══════════════════════════════════════════════════════════
  // DELETE CONFIRMATION
  // ═══════════════════════════════════════════════════════════
  const confirmDelete = (type, id, title) => {
    setDeleteTarget({ type, id, title });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    markChanged();

    if (type === 'phone') {
      setPhones(prev => {
        const filtered = prev.filter(p => p.id !== id);
        if (filtered.length > 0 && !filtered.some(p => p.isPrimary)) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
    } else if (type === 'whatsapp') {
      setWhatsapps(prev => {
        const filtered = prev.filter(w => w.id !== id);
        if (filtered.length > 0 && !filtered.some(w => w.isPrimary)) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
    } else if (type === 'email') {
      setEmails(prev => {
        const filtered = prev.filter(e => e.id !== id);
        if (filtered.length > 0 && !filtered.some(e => e.isPrimary)) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
    } else if (type === 'address') {
      setAddresses(prev => {
        const filtered = prev.filter(a => a.id !== id);
        if (filtered.length > 0 && !filtered.some(a => a.isPrimary)) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
    } else if (type === 'registration') {
      setRegistrations(prev => prev.filter(r => r.id !== id));
    } else if (type === 'social') {
      setSocialLinks(prev => prev.filter(s => s.id !== id));
    } else if (type === 'image') {
      setOfficeImages(prev => {
        const filtered = prev.filter(img => img.id !== id);
        if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
    }

    setDeleteTarget(null);
  };

  // ═══════════════════════════════════════════════════════════
  // PHOTO CLOUDINARY UPLOAD
  // ═══════════════════════════════════════════════════════════
  const handlePhotoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setUploadError('');
      const res = await contactService.uploadContactImage(file, file.name);
      if (res && res.success && res.image) {
        markChanged();
        const newImg = {
          id: generateLocalId('img'),
          url: res.image.url,
          publicId: res.image.publicId || '',
          alt: res.image.alt || 'Sriyas Healthcare Corporate Office',
          caption: 'Corporate Office, Chennai',
          isPrimary: officeImages.length === 0,
          displayOrder: officeImages.length + 1
        };
        setOfficeImages(prev => [...prev, newImg]);
      } else {
        setUploadError(res?.message || 'Failed to upload photo.');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Error uploading file.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <div className="state-title">Loading Contact Information from MongoDB...</div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Corporate Contact Information Management</h1>
          <p>
            Central source of truth for all public contact details, multiple phone &amp; WhatsApp lines, office locations, operating hours, and media.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/contact" target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-secondary">
            👁️ View Live Contact Page ↗
          </Link>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={handleSaveAll}
            disabled={saving}
            id="admin-save-contact-info-btn"
          >
            {saving ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Saving to MongoDB...</span>
              </>
            ) : (
              <span>💾 Save All Contact Changes</span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          className="admin-card"
          style={{
            borderColor: 'var(--status-success)',
            background: 'rgba(39, 174, 96, 0.08)',
            marginBottom: '20px',
            color: 'var(--status-success)',
            fontWeight: 600
          }}
        >
          {successMsg}
        </div>
      )}

      {error && (
        <div
          className="admin-card"
          style={{
            borderColor: 'var(--status-danger)',
            background: 'rgba(192, 57, 43, 0.08)',
            marginBottom: '20px',
            color: 'var(--status-danger)',
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      {hasChanges && (
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(169, 130, 44, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}
        >
          <span>
            ⚠️ <strong>Unsaved Changes:</strong> You have modified contact settings. Click <strong>Save All Contact Changes</strong> to persist your updates to the live site.
          </span>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={handleSaveAll}
            disabled={saving}
          >
            Save Now
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '2px solid rgba(169, 130, 44, 0.2)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        {[
          { key: 'phones', label: '📞 Main Office Phones', count: phones.length },
          { key: 'whatsapps', label: '💬 WhatsApp Support', count: whatsapps.length },
          { key: 'addresses', label: '📍 Corporate Office Address', count: addresses.length },
          { key: 'registrations', label: '📑 GSTIN & Drug Licences', count: registrations.length },
          { key: 'emails', label: '✉️ Official Email', count: emails.length },
          { key: 'images', label: '🏢 Photos & Map', count: officeImages.length },
          { key: 'social', label: '🌐 Social Profiles', count: socialLinks.length }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="adm-btn"
            style={{
              borderRadius: '8px 8px 0 0',
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? 'var(--gold-dark)' : 'var(--text-mute)',
              boxShadow: activeTab === tab.key ? '0 -2px 10px rgba(0,0,0,0.06)' : 'none',
              borderBottom: activeTab === tab.key ? '3px solid var(--gold-dark)' : '3px solid transparent'
            }}
          >
            {tab.label} {tab.count !== null && <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: PHONES
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'phones' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>Main Office &ndash; Contact Numbers</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                Configure the two primary telephone lines displayed in the combined &ldquo;Main Office &ndash; Contact Numbers&rdquo; tile on the Contact page. Both numbers can be independently edited.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => openAddModal('phone')}
            >
              + Add Additional Phone Line
            </button>
          </div>

          {/* Dedicated Main Office Group: Phone 1 & Phone 2 */}
          <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(169, 130, 44, 0.25)', borderRadius: 'var(--radius-sm)', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏢</span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>Main Office Contact Group (Public Contact Page Tile 2)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Phone 1 Card */}
              <div style={{ background: '#fff', border: '1px solid #e0d8c8', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>Phone 1</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold-deep)', borderRadius: '4px', fontWeight: 700 }}>
                      ★ Primary
                    </span>
                  </div>
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      background: phones[0]?.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                      color: phones[0]?.isActive !== false ? 'var(--status-success)' : '#777'
                    }}
                    onClick={() => toggleItemActive('phone', phones[0]?.id)}
                  >
                    {phones[0]?.isActive !== false ? '● Active' : '○ Disabled'}
                  </button>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Phone Number (Phone 1)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      style={{ width: '60px', padding: '8px 6px', border: '1px solid #dcd3c3', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}
                      value={phones[0]?.countryCode || '+91'}
                      onChange={(e) => updateMainOfficePhone(0, 'countryCode', e.target.value)}
                    />
                    <input
                      type="text"
                      style={{ flex: 1, padding: '8px 10px', border: '1px solid #dcd3c3', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}
                      value={phones[0]?.number || ''}
                      onChange={(e) => updateMainOfficePhone(0, 'number', e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="e.g. 9600804456"
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Description / Purpose (Phone 1)
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dcd3c3', borderRadius: '4px', fontSize: '0.85rem' }}
                    value={phones[0]?.purpose || ''}
                    onChange={(e) => updateMainOfficePhone(0, 'purpose', e.target.value)}
                    placeholder="e.g. General & Institutional Enquiries"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-mute)', marginTop: '8px' }}>
                  <span>Display Order: <strong>{phones[0]?.displayOrder || 1}</strong></span>
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    onClick={() => openEditModal('phone', phones[0])}
                  >
                    Advanced Settings
                  </button>
                </div>
              </div>

              {/* Phone 2 Card */}
              <div style={{ background: '#fff', border: '1px solid #e0d8c8', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>Phone 2</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-mute)', borderRadius: '4px' }}>
                      Secondary Line
                    </span>
                  </div>
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      background: phones[1]?.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                      color: phones[1]?.isActive !== false ? 'var(--status-success)' : '#777'
                    }}
                    onClick={() => toggleItemActive('phone', phones[1]?.id)}
                  >
                    {phones[1]?.isActive !== false ? '● Active' : '○ Disabled'}
                  </button>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Phone Number (Phone 2)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      style={{ width: '60px', padding: '8px 6px', border: '1px solid #dcd3c3', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}
                      value={phones[1]?.countryCode || '+91'}
                      onChange={(e) => updateMainOfficePhone(1, 'countryCode', e.target.value)}
                    />
                    <input
                      type="text"
                      style={{ flex: 1, padding: '8px 10px', border: '1px solid #dcd3c3', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}
                      value={phones[1]?.number || ''}
                      onChange={(e) => updateMainOfficePhone(1, 'number', e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="e.g. 9367772801"
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Description / Purpose (Phone 2)
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dcd3c3', borderRadius: '4px', fontSize: '0.85rem' }}
                    value={phones[1]?.purpose || ''}
                    onChange={(e) => updateMainOfficePhone(1, 'purpose', e.target.value)}
                    placeholder="e.g. General Enquiries"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-mute)', marginTop: '8px' }}>
                  <span>Display Order: <strong>{phones[1]?.displayOrder || 2}</strong></span>
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    onClick={() => openEditModal('phone', phones[1])}
                  >
                    Advanced Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', color: 'var(--ink)', marginBottom: '12px' }}>All Configured Phone Numbers</h3>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Display Label</th>
                  <th>Number</th>
                  <th>Purpose / Department</th>
                  <th>Primary</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {phones.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                      No phone numbers configured. Click &ldquo;+ Add Phone Number&rdquo; to add one.
                    </td>
                  </tr>
                ) : (
                  phones.map((phone, idx) => (
                    <tr key={phone.id}>
                      <td>
                        <strong>{phone.label}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {phone.countryCode} {phone.number}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-mute)', fontSize: '0.85rem' }}>
                          {phone.purpose || 'General'}
                        </span>
                      </td>
                      <td>
                        {phone.isPrimary ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: 'rgba(212, 175, 55, 0.2)',
                              color: 'var(--gold-deep)',
                              fontWeight: 700,
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}
                          >
                            ★ Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={() => setPrimaryItem('phone', phone.id)}
                            title="Make this the primary phone for website footer and header"
                          >
                            Set Primary
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            background: phone.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                            color: phone.isActive !== false ? 'var(--status-success)' : '#777'
                          }}
                          onClick={() => toggleItemActive('phone', phone.id)}
                        >
                          {phone.isActive !== false ? '● Active' : '○ Disabled'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {phone.showOnContactPage && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#f0f0f0', borderRadius: '3px' }}>
                              Contact
                            </span>
                          )}
                          {phone.showInFooter && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#f0f0f0', borderRadius: '3px' }}>
                              Footer
                            </span>
                          )}
                          {phone.enableClickToCall && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#f0f0f0', borderRadius: '3px' }}>
                              Click2Call
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => moveItem('phone', idx, -1)}
                            disabled={idx === 0}
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => moveItem('phone', idx, 1)}
                            disabled={idx === phones.length - 1}
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditModal('phone', phone)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => confirmDelete('phone', phone.id, `${phone.label} (${phone.number})`)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: WHATSAPP
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'whatsapps' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>WhatsApp Contact Channels</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                Configure WhatsApp numbers, prefilled greeting messages, and the site-wide floating WhatsApp widget.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => openAddModal('whatsapp')}
            >
              + Add WhatsApp Channel
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Display Label</th>
                  <th>WhatsApp Number</th>
                  <th>Department</th>
                  <th>Prefilled Message</th>
                  <th>Primary Channel</th>
                  <th>Floating Button</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {whatsapps.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                      No WhatsApp channels configured.
                    </td>
                  </tr>
                ) : (
                  whatsapps.map((wa, idx) => (
                    <tr key={wa.id}>
                      <td>
                        <strong>{wa.label}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{wa.number}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-mute)', fontSize: '0.85rem' }}>
                          {wa.department || 'Support'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#555', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={wa.prefilledMessage}>
                          {wa.prefilledMessage || 'Default greeting'}
                        </span>
                      </td>
                      <td>
                        {wa.isPrimary ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: 'rgba(212, 175, 55, 0.2)',
                              color: 'var(--gold-deep)',
                              fontWeight: 700,
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}
                          >
                            ★ Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={() => setPrimaryItem('whatsapp', wa.id)}
                          >
                            Set Primary
                          </button>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: wa.enableFloatingButton !== false ? 'var(--status-success)' : '#888' }}>
                          {wa.enableFloatingButton !== false ? '✓ Enabled' : '✕ Disabled'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            background: wa.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                            color: wa.isActive !== false ? 'var(--status-success)' : '#777'
                          }}
                          onClick={() => toggleItemActive('whatsapp', wa.id)}
                        >
                          {wa.isActive !== false ? '● Active' : '○ Disabled'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <a
                            href={`https://wa.me/${wa.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(wa.prefilledMessage || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            title="Test Chat Link"
                          >
                            Chat ↗
                          </a>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditModal('whatsapp', wa)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => confirmDelete('whatsapp', wa.id, `${wa.label} (${wa.number})`)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: OFFICIAL EMAIL & CORRESPONDENCE
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'emails' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>Official Email &amp; Correspondence</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                Official email address displayed in the Contact page 3×2 grid (Row 2, Tile 1) and the global website footer. Editing this address updates all public mailto links instantly upon saving.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => openAddModal('email')}
            >
              + Add Additional Email Address
            </button>
          </div>

          {/* Dedicated Official Email Group: Public Contact Page Tile & Global Footer */}
          <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(169, 130, 44, 0.25)', borderRadius: 'var(--radius-sm)', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.2rem' }}>✉️</span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>
                Official Corporate Email (Public Contact Page Row 2, Tile 1 &amp; Site Footer)
              </h3>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e0d8c8', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', maxWidth: '680px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>Primary Official Email</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold-deep)', borderRadius: '4px', fontWeight: 700 }}>
                    ★ Primary
                  </span>
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    background: primaryEmailItem?.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                    color: primaryEmailItem?.isActive !== false ? 'var(--status-success)' : '#777'
                  }}
                  onClick={() => toggleItemActive('email', primaryEmailItem?.id)}
                >
                  {primaryEmailItem?.isActive !== false ? '● Active' : '○ Disabled'}
                </button>
              </div>

              <div className="admin-form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Official Email Address *
                </label>
                <input
                  type="email"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dcd3c3', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}
                  value={primaryEmailItem?.email || ''}
                  onChange={(e) => updatePrimaryEmail('email', e.target.value)}
                  placeholder="e.g. sriyashealthcare@gmail.com"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div className="admin-form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Tile Heading / Display Label
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dcd3c3', borderRadius: '4px', fontSize: '0.85rem' }}
                    value={primaryEmailItem?.label || ''}
                    onChange={(e) => updatePrimaryEmail('label', e.target.value)}
                    placeholder="e.g. Official Email"
                  />
                </div>

                <div className="admin-form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Tile Subtext / Department
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dcd3c3', borderRadius: '4px', fontSize: '0.85rem' }}
                    value={primaryEmailItem?.department || ''}
                    onChange={(e) => updatePrimaryEmail('department', e.target.value)}
                    placeholder="e.g. Corporate &amp; Institutional Correspondence"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-mute)', marginTop: '8px' }}>
                <span>
                  Rendered in Contact 3×2 grid as: <strong>{primaryEmailItem?.email || 'sriyashealthcare@gmail.com'}</strong>
                </span>
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => openEditModal('email', primaryEmailItem)}
                >
                  Advanced Settings
                </button>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', color: 'var(--ink)', marginBottom: '12px' }}>All Configured Email Addresses</h3>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Display Label</th>
                  <th>Email Address</th>
                  <th>Department</th>
                  <th>Primary</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                      No emails configured. Click &ldquo;+ Add Additional Email Address&rdquo; to add one.
                    </td>
                  </tr>
                ) : (
                  emails.map((email, idx) => (
                    <tr key={email.id}>
                      <td>
                        <strong>{email.label}</strong>
                      </td>
                      <td>
                        <a href={`mailto:${email.email}`} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
                          {email.email}
                        </a>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-mute)', fontSize: '0.85rem' }}>
                          {email.department || 'General'}
                        </span>
                      </td>
                      <td>
                        {email.isPrimary ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: 'rgba(212, 175, 55, 0.2)',
                              color: 'var(--gold-deep)',
                              fontWeight: 700,
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}
                          >
                            ★ Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={() => setPrimaryItem('email', email.id)}
                          >
                            Set Primary
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            background: email.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                            color: email.isActive !== false ? 'var(--status-success)' : '#777'
                          }}
                          onClick={() => toggleItemActive('email', email.id)}
                        >
                          {email.isActive !== false ? '● Active' : '○ Disabled'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {email.showOnContactPage !== false && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#f0f0f0', borderRadius: '3px' }}>
                              Contact
                            </span>
                          )}
                          {email.showInFooter && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#f0f0f0', borderRadius: '3px' }}>
                              Footer
                            </span>
                          )}
                          {email.enableMailto && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#f0f0f0', borderRadius: '3px' }}>
                              Mailto
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditModal('email', email)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => confirmDelete('email', email.id, `${email.label} (${email.email})`)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: ADDRESSES
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'addresses' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>Corporate &amp; Branch Office Locations</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                Manage physical headquarters, warehouse facilities, and regional branch addresses.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => openAddModal('address')}
            >
              + Add Office Address
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {addresses.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                No office addresses configured.
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    border: '1px solid rgba(169, 130, 44, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '18px',
                    background: addr.isPrimary ? 'rgba(212, 175, 55, 0.04)' : '#fff',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-dark)', fontWeight: 700 }}>
                          {addr.officeType || 'Office'}
                        </span>
                        <h3 style={{ fontSize: '1.1rem', margin: '2px 0 0', color: 'var(--ink)' }}>
                          {addr.officeName}
                        </h3>
                      </div>
                      {addr.isPrimary ? (
                        <span
                          style={{
                            padding: '2px 8px',
                            background: 'rgba(212, 175, 55, 0.2)',
                            color: 'var(--gold-deep)',
                            fontWeight: 700,
                            borderRadius: '4px',
                            fontSize: '0.72rem'
                          }}
                        >
                          ★ Primary Office
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                          onClick={() => setPrimaryItem('address', addr.id)}
                        >
                          Set Primary
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#444', lineHeight: 1.5, margin: '8px 0' }}>
                      {addr.line1}
                      {addr.line2 && <><br />{addr.line2}</>}
                      {addr.area && <><br />{addr.area}</>}
                      <br />
                      {addr.city} &ndash; {addr.pincode}, {addr.state}, {addr.country}
                    </p>

                    {addr.googleMapsUrl && (
                      <div style={{ margin: '10px 0 14px' }}>
                        <a
                          href={addr.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.8rem', color: 'var(--gold-dark)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          📍 View on Google Maps ↗
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f0eada' }}>
                    <button
                      type="button"
                      className="adm-btn adm-btn-sm"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        background: addr.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                        color: addr.isActive !== false ? 'var(--status-success)' : '#777'
                      }}
                      onClick={() => toggleItemActive('address', addr.id)}
                    >
                      {addr.isActive !== false ? '● Active' : '○ Disabled'}
                    </button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => openEditModal('address', addr)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        onClick={() => confirmDelete('address', addr.id, addr.officeName)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: STATUTORY REGISTRATIONS (GSTIN & DRUG LICENCES)
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'registrations' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>GSTIN &amp; Drug Licences</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                Official corporate statutory identifiers displayed on the Contact page (Tiles 4 &amp; 5) and footer.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => openAddModal('registration')}
            >
              + Add Custom Registration
            </button>
          </div>

          {/* Quick Edit for GSTIN & Both Drug Licences */}
          <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(169, 130, 44, 0.25)', borderRadius: 'var(--radius-sm)', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: 'var(--ink)' }}>
              📑 Official Identifiers (Public Contact Page Tiles 4 &amp; 5)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* GSTIN */}
              <div className="admin-form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  GSTIN (Goods and Services Tax Identification Number) *
                </label>
                <input
                  type="text"
                  className="admin-field-input"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd3c3', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem' }}
                  value={gstinValue}
                  onChange={(e) => updateStatutoryRegistration('gstin', e.target.value)}
                  placeholder="33ABQCS4744P1ZJ"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-mute)', marginTop: '4px', display: 'block' }}>
                  Publicly displayed on Contact Page Tile 4 and Website Footer.
                </span>
              </div>

              {/* Drug Licence 1 */}
              <div className="admin-form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Drug Licence Number 1 (Form 20B) *
                </label>
                <input
                  type="text"
                  className="admin-field-input"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd3c3', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem' }}
                  value={dl1Value}
                  onChange={(e) => updateStatutoryRegistration('dl1', e.target.value)}
                  placeholder="TN/Z04/20B/01443"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-mute)', marginTop: '4px', display: 'block' }}>
                  Publicly displayed on Contact Page Tile 5.
                </span>
              </div>

              {/* Drug Licence 2 */}
              <div className="admin-form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Drug Licence Number 2 (Form 21B) *
                </label>
                <input
                  type="text"
                  className="admin-field-input"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd3c3', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem' }}
                  value={dl2Value}
                  onChange={(e) => updateStatutoryRegistration('dl2', e.target.value)}
                  placeholder="TN/Z04/21B/01443"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-mute)', marginTop: '4px', display: 'block' }}>
                  Publicly displayed on Contact Page Tile 5.
                </span>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', color: 'var(--ink)', marginBottom: '12px' }}>All Configured Registrations</h3>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Statutory Identifier</th>
                  <th>Registration Value</th>
                  <th>Display Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                      No statutory registrations configured.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <strong>{reg.label}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>
                          {reg.value}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: 'var(--text-mute)' }}>
                          {reg.displayLocation === 'both' ? 'Contact Page & Footer' : reg.displayLocation === 'contact_page' ? 'Contact Page Only' : 'Footer Only'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            background: reg.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                            color: reg.isActive !== false ? 'var(--status-success)' : '#777'
                          }}
                          onClick={() => toggleItemActive('registration', reg.id)}
                        >
                          {reg.isActive !== false ? '● Active' : '○ Disabled'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditModal('registration', reg)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => confirmDelete('registration', reg.id, `${reg.label}: ${reg.value}`)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 7: SOCIAL MEDIA
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'social' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>Corporate Social Media Links</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                Social channels linked in footer and contact page. Only active profiles with valid URLs are displayed.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => openAddModal('social')}
            >
              + Add Social Profile
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Display Label</th>
                  <th>Profile URL</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {socialLinks.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                      No social profiles configured.
                    </td>
                  </tr>
                ) : (
                  socialLinks.map((soc) => (
                    <tr key={soc.id}>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{soc.platform}</span>
                      </td>
                      <td>
                        <strong>{soc.label}</strong>
                      </td>
                      <td>
                        <a href={soc.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-dark)', fontSize: '0.85rem' }}>
                          {soc.url}
                        </a>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            background: soc.isActive !== false ? 'rgba(39, 174, 96, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                            color: soc.isActive !== false ? 'var(--status-success)' : '#777'
                          }}
                          onClick={() => toggleItemActive('social', soc.id)}
                        >
                          {soc.isActive !== false ? '● Active' : '○ Disabled'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditModal('social', soc)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => confirmDelete('social', soc.id, soc.label)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 8: PHOTOS & MAPS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'images' && (
        <div className="admin-card">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)' }}>Office Photographs &amp; Google Maps</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
              Manage office imagery (stored on Cloudinary) and Google Maps location pins for visitor directions.
            </p>
          </div>

          {/* Google Maps Configuration */}
          <div style={{ background: '#FAF7F0', border: '1px solid rgba(169, 130, 44, 0.25)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 12px', color: 'var(--ink)' }}>Google Maps Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Google Maps Location URL
                </label>
                <input
                  type="url"
                  className="admin-field-input"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd3c3', borderRadius: '6px' }}
                  value={googleMapsUrl}
                  onChange={(e) => {
                    markChanged();
                    setGoogleMapsUrl(e.target.value);
                  }}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              <div className="admin-form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="admin-field-input"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd3c3', borderRadius: '6px' }}
                  value={mapCoordinates.lat}
                  onChange={(e) => {
                    markChanged();
                    setMapCoordinates(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }));
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="admin-field-input"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd3c3', borderRadius: '6px' }}
                  value={mapCoordinates.lng}
                  onChange={(e) => {
                    markChanged();
                    setMapCoordinates(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Office Photos Gallery */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--ink)' }}>Corporate Office Photographs</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label
                className="adm-btn adm-btn-secondary adm-btn-sm"
                style={{ cursor: 'pointer', margin: 0 }}
              >
                {uploadingImage ? 'Uploading...' : '📁 Upload New Photograph'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingImage}
                />
              </label>
              <button
                type="button"
                className="adm-btn adm-btn-primary adm-btn-sm"
                onClick={() => openAddModal('image')}
              >
                + Add Image by URL
              </button>
            </div>
          </div>

          {uploadError && (
            <div style={{ color: 'var(--status-danger)', fontSize: '0.85rem', marginBottom: '12px' }}>
              ⚠ {uploadError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {officeImages.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: 'var(--text-mute)' }}>
                No office photographs added yet.
              </div>
            ) : (
              officeImages.map((img) => (
                <div
                  key={img.id}
                  style={{
                    border: '1px solid rgba(169, 130, 44, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ height: '240px', background: '#FAF7F0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                    <img
                      src={img.url}
                      alt={img.alt || 'Office photograph'}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    {img.isPrimary && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        ★ Main Photo
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                        {img.caption || 'Storefront Facility'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                        Alt: {img.alt || 'None'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                      {!img.isPrimary ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                          onClick={() => setPrimaryItem('image', img.id)}
                        >
                          Make Main
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                          Active Main
                        </span>
                      )}
                      <button
                        type="button"
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        onClick={() => confirmDelete('image', img.id, img.caption || 'Office photograph')}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {modalType && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <h3>
              {editingItem ? 'Edit' : 'Add'}{' '}
              {modalType === 'phone' && 'Phone Number'}
              {modalType === 'whatsapp' && 'WhatsApp Channel'}
              {modalType === 'email' && 'Email Address'}
              {modalType === 'address' && 'Office Location'}
              {modalType === 'registration' && 'Company Registration'}
              {modalType === 'social' && 'Social Profile'}
              {modalType === 'image' && 'Office Image'}
            </h3>
            <p style={{ marginBottom: '16px' }}>
              Fill in the details below. Changes will be staged for saving.
            </p>

            {modalError && (
              <div style={{ color: 'var(--status-danger)', fontSize: '0.85rem', marginBottom: '12px' }}>
                ⚠ {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              {/* Phone Modal Fields */}
              {modalType === 'phone' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Display Label *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.label || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g. Main Office / Clinical Supply Enquiries"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        Country Code
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.countryCode || '+91'}
                        onChange={(e) => setModalForm(prev => ({ ...prev, countryCode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.number || ''}
                        onChange={(e) => setModalForm(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="e.g. 9600804456"
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Purpose / Department
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.purpose || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, purpose: e.target.value }))}
                      placeholder="e.g. General & Hospital Enquiries"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.isPrimary || false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                      Primary Phone
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.showOnContactPage !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, showOnContactPage: e.target.checked }))}
                      />
                      Show on Contact Page
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.showInFooter !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, showInFooter: e.target.checked }))}
                      />
                      Show in Footer
                    </label>
                  </div>
                </>
              )}

              {/* WhatsApp Modal Fields */}
              {modalType === 'whatsapp' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Display Label *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.label || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g. Official WhatsApp Support"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      WhatsApp Number (with country code, digits only) *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.number || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="e.g. 919600804456"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.department || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Healthcare Solutions & Product Assistance"
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Prefilled Greeting Message
                    </label>
                    <textarea
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.prefilledMessage || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, prefilledMessage: e.target.value }))}
                      placeholder="Hello Sriyas Healthcare Team, I visited your website..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.isPrimary || false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                      Primary WhatsApp Channel
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.enableFloatingButton !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, enableFloatingButton: e.target.checked }))}
                      />
                      Enable Floating Button
                    </label>
                  </div>
                </>
              )}

              {/* Email Modal Fields */}
              {modalType === 'email' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Display Label *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.label || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g. General Enquiries"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.email || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. sriyashealthcare@gmail.com"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.department || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Surgical Product Quotes"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.isPrimary || false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                      Primary Email
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.showOnContactPage !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, showOnContactPage: e.target.checked }))}
                      />
                      Show on Contact Page Tile
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.showInFooter !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, showInFooter: e.target.checked }))}
                      />
                      Show in Footer
                    </label>
                  </div>
                </>
              )}

              {/* Address Modal Fields */}
              {modalType === 'address' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        Office Name *
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.officeName || ''}
                        onChange={(e) => setModalForm(prev => ({ ...prev, officeName: e.target.value }))}
                        placeholder="e.g. Corporate Office"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        Office Type
                      </label>
                      <select
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.officeType || 'Head Office'}
                        onChange={(e) => setModalForm(prev => ({ ...prev, officeType: e.target.value }))}
                      >
                        <option value="Head Office">Head Office</option>
                        <option value="Branch Office">Branch Office</option>
                        <option value="Distribution Hub">Distribution Hub</option>
                        <option value="Warehouse">Warehouse</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.line1 || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, line1: e.target.value }))}
                      placeholder="Plot No.53A, First Floor, East Facing, Oil Mill Road"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.line2 || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, line2: e.target.value }))}
                      placeholder="Maruthi Nagar, Karambakkam, Thundalam"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.city || 'Chennai'}
                        onChange={(e) => setModalForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        State *
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.state || 'Tamil Nadu'}
                        onChange={(e) => setModalForm(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.pincode || ''}
                        onChange={(e) => setModalForm(prev => ({ ...prev, pincode: e.target.value }))}
                        placeholder="600077"
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Google Maps Link
                    </label>
                    <input
                      type="url"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.googleMapsUrl || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.isPrimary || false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                      Primary Office
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.showOnContactPage !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, showOnContactPage: e.target.checked }))}
                      />
                      Show on Contact Page
                    </label>
                    <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={modalForm.showInFooter !== false}
                        onChange={(e) => setModalForm(prev => ({ ...prev, showInFooter: e.target.checked }))}
                      />
                      Show in Footer
                    </label>
                  </div>
                </>
              )}

              {/* Registration Modal Fields */}
              {modalType === 'registration' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Statutory Label *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.label || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g. GSTIN / Drug Licence No / CIN"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Registration Value *
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.value || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="e.g. 33ABQCS4744P1ZJ"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Display Location
                    </label>
                    <select
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.displayLocation || 'both'}
                      onChange={(e) => setModalForm(prev => ({ ...prev, displayLocation: e.target.value }))}
                    >
                      <option value="both">Both Contact Page & Footer</option>
                      <option value="contact_page">Contact Page Only</option>
                      <option value="footer">Footer Only</option>
                    </select>
                  </div>
                </>
              )}

              {/* Social Modal Fields */}
              {modalType === 'social' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        Platform
                      </label>
                      <select
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.platform || 'linkedin'}
                        onChange={(e) => setModalForm(prev => ({ ...prev, platform: e.target.value }))}
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="youtube">YouTube</option>
                        <option value="x">X (Twitter)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        Display Label *
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={modalForm.label || ''}
                        onChange={(e) => setModalForm(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g. Sriyas Healthcare LinkedIn"
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Profile URL *
                    </label>
                    <input
                      type="url"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.url || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://www.linkedin.com/company/sriyas-healthcare"
                      required
                    />
                  </div>
                </>
              )}

              {/* Image URL Modal Fields */}
              {modalType === 'image' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Image URL *
                    </label>
                    <input
                      type="url"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.url || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://res.cloudinary.com/..."
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Caption / Title
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.caption || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Corporate Office, Chennai"
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Alt Text (Accessibility)
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      value={modalForm.alt || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, alt: e.target.value }))}
                      placeholder="Sriyas Healthcare facility exterior"
                    />
                  </div>
                </>
              )}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ═══════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--status-danger)' }}>Confirm Deletion</h3>
            <p>
              Are you sure you want to remove <strong>{deleteTarget.title}</strong>?
              This will unstage it from the contact management directory.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger"
                onClick={executeDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
