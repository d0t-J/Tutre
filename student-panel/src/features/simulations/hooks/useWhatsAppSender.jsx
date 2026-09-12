import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../../services/supabase';
import html2pdf from 'html2pdf.js';
import StudyGuidePrintView from '../components/StudyGuidePrintView';

export function useWhatsAppSender(simulation, generateStudyGuideData) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  const sendToWhatsApp = async (phoneNumber) => {
    setIsSending(true);
    setError(null);
    
    try {
      if (!phoneNumber) {
        throw new Error('Please enter a WhatsApp number.');
      }

      // Format phone number for Pakistan (+92) default
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+92' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('+')) {
        if (phoneNumber.startsWith('92')) {
          phoneNumber = '+' + phoneNumber;
        } else {
          phoneNumber = '+92' + phoneNumber;
        }
      }

      // 1. Generate the HTML data for PDF
      if (!generateStudyGuideData) {
        throw new Error('Missing PDF generation function.');
      }
      
      const data = await generateStudyGuideData();
      if (!data) {
        throw new Error('Failed to generate Study Guide data.');
      }

      // 2. Render to a hidden div for rasterization
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '794px'; // A4 width at 96 DPI
      tempDiv.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      const printRef = React.createRef();
      
      await new Promise(resolve => {
        root.render(
          <StudyGuidePrintView 
            ref={printRef}
            simulation={simulation} 
            htmlContent={data.htmlContent} 
            snapshotDataUrl={data.snapshotDataUrl} 
          />
        );
        // Give it a moment to render and load assets (like the logo)
        setTimeout(resolve, 800);
      });

      const fileName = `${simulation.topic.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.pdf`;

      // 3. Rasterize and create PDF using html2pdf.js
      const opt = {
        margin:       15, // 15mm margins
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      const pdfBlob = await html2pdf().set(opt).from(printRef.current).output('blob');

      // Cleanup DOM
      root.unmount();
      document.body.removeChild(tempDiv);
      
      const filePath = `${Date.now()}_${fileName}`;

      // 4. Upload to Supabase Storage (requires a whatsapp_documents bucket to exist and be public)
      const { error: uploadError } = await supabase.storage
        .from('whatsapp_documents')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload document: ${uploadError.message}`);
      }

      // 3. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('whatsapp_documents')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 4. Invoke Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          phoneNumber, 
          fileUrl, 
          fileName 
        }
      });

      if (functionError) {
        throw new Error(`Failed to send WhatsApp message: ${functionError.message}`);
      }

      if (!functionData?.success) {
        throw new Error(functionData?.error || 'Failed to send WhatsApp message.');
      }

      return { success: true };

    } catch (err) {
      console.error('WhatsApp sending error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    error,
    sendToWhatsApp
  };
}
