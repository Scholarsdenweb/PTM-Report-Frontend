// PdfAnnotator.jsx

import React, { useState } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
} from "react-pdf-highlighter";
import { PDFDocument, rgb } from "pdf-lib";

// import testPdf from "../assets/testPdf.pdf";

const PdfAnnotator = ({ student, onSaveSuccess }) => {
  const [highlights, setHighlights] = useState([]);

  const handleAddHighlight = (highlight) => {
    setHighlights((prev) => [...prev, highlight]);
  };

  const saveAnnotatedPdf = async () => {
    try {
      // Fetch the PDF
      const resp = await fetch(student.originalPdfUrl, {
        mode: "cors", // ensure CORS
      });
      if (!resp.ok) {
        throw new Error("Failed to fetch PDF: " + resp.status);
      }
      const arrayBuffer = await resp.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const pages = pdfDoc.getPages();

      for (let highlight of highlights) {
        const { position, comment } = highlight;
        const pageIndex = position.pageNumber - 1;
        const page = pages[pageIndex];

        const { boundingRect, content } = position;
        // draw highlight rectangle
        page.drawRectangle({
          x: boundingRect.x1,
          y: page.getHeight() - boundingRect.y2,
          width: boundingRect.x2 - boundingRect.x1,
          height: boundingRect.y2 - boundingRect.y1,
          color: rgb(1, 1, 0),
          opacity: 0.5,
        });

        // optionally draw comment text (just above or somewhere)
        if (comment?.text) {
          page.drawText(comment.text, {
            x: boundingRect.x1,
            y: page.getHeight() - boundingRect.y2 - 15,
            size: 10,
            color: rgb(0, 0, 0),
          });
        }
      }

      const editedBytes = await pdfDoc.save();
      const blob = new Blob([editedBytes], { type: "application/pdf" });

      // Upload to Cloudinary with resource_type=auto (not raw)
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "YOUR_UPLOAD_PRESET");
      formData.append("resource_type", "auto");

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/dtytgoj3f/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) {
        throw new Error(
          "Cloudinary upload failed: " + JSON.stringify(cloudData)
        );
      }

      const uploadedUrl = cloudData.secure_url;

      // Notify backend
      await fetch("/api/update-student-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.rollNo,
          editedPdfUrl: uploadedUrl,
        }),
      });

      alert("PDF Saved and Uploaded!");
      if (onSaveSuccess) {
        onSaveSuccess(uploadedUrl);
      }
    } catch (err) {
      console.error("Error saving annotated PDF:", err);
      alert("Error: " + err.message);
    }
  };

  console.log("Student details ", student);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <button
        onClick={saveAnnotatedPdf}
        style={{ marginBottom: "10px", padding: "8px 16px" }}
      >
        💾 Save and Upload Edited PDF
      </button>

      <PdfLoader
        url={"../assets/testPdf.pdf"}
        // url={student.originalPdfUrl}
        beforeLoad={<div>Loading PDF...</div>}
      >
        {(pdfDocument) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            enableAreaSelection={(event) => event.altKey}
            onScrollChange={() => {}}
            scrollRef={() => {}}
            highlights={highlights}
            onSelectionFinished={(
              position,
              content,
              hideTipAndSelection,
              transformSelection
            ) => (
              <Tip
                onOpen={transformSelection}
                onConfirm={(comment) => {
                  handleAddHighlight({ position, content, comment });
                  hideTipAndSelection();
                }}
              />
            )}
            highlightTransform={(highlight, index, setTip, hideTip) => (
              <Popup
                key={index}
                popupContent={<div>{highlight.comment.text}</div>}
                onMouseOver={setTip}
                onMouseOut={hideTip}
              >
                <Highlight {...highlight} />
              </Popup>
            )}
            onPdfViewerClick={() => {}}
          />
        )}
      </PdfLoader>
    </div>
  );
};

export default PdfAnnotator;
