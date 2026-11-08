import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import { gsap } from "gsap";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import {
  ChevronLeft, ChevronRight, Copy, Maximize2, MonitorPlay, Plus,
  Save, Shapes, Trash2, Type,
} from "lucide-react";

const WIDTH = 960;
const HEIGHT = 540;

type ElementType = "text" | "shape" | "image";
type AnimationType = "none" | "fade" | "slide" | "zoom";
type SlideElement = {
  id: string; type: ElementType; x: number; y: number; width: number;
  height: number; text?: string; color: string; imageUrl?: string; animation: AnimationType;
};
type Slide = { id: string; title: string; background: string; elements: SlideElement[] };

const makeId = () => crypto.randomUUID();
const initialSlide = (): Slide => ({
  id: makeId(),
  title: "Trang mở đầu",
  background: "linear-gradient(135deg, #0f172a, #312e81)",
  elements: [
    { id: makeId(), type: "text", x: 110, y: 120, width: 740, height: 110, text: "Tên bài thuyết trình", color: "#ffffff", animation: "fade" },
    { id: makeId(), type: "shape", x: 110, y: 245, width: 160, height: 8, color: "#38bdf8", animation: "slide" },
    { id: makeId(), type: "text", x: 110, y: 275, width: 650, height: 60, text: "Phụ đề · Người trình bày · 2026", color: "#cbd5e1", animation: "zoom" },
  ],
});

export function PresentationEditor({ imageUrl }: { imageUrl: string | null }) {
  const [slides, setSlides] = useState<Slide[]>([initialSlide()]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const transformerRef = useRef<Konva.Transformer>(null);
  const slide = slides[slideIndex] ?? slides[0];
  const selected = slide.elements.find((item) => item.id === selectedId);

  useEffect(() => {
    const prevent = (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedId) {
        setSlides((current) => current.map((item, index) =>
          index === slideIndex
            ? { ...item, elements: item.elements.filter((element) => element.id !== selectedId) }
            : item,
        ));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", prevent);
    return () => window.removeEventListener("keydown", prevent);
  }, [selectedId, slideIndex]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 3500);
    return () => window.clearTimeout(timer);
  }, [slides, saved]);

  const updateSlides = (next: Slide[]) => {
    setSlides(next);
    setSaved(false);
  };

  const updateSlide = (patch: Partial<Slide>) => {
    updateSlides(slides.map((item, index) => index === slideIndex ? { ...item, ...patch } : item));
  };

  const updateElement = (id: string, patch: Partial<SlideElement>) => {
    updateSlide({
      elements: slide.elements.map((item) => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const addSlide = () => {
    const next: Slide = {
      id: makeId(),
      title: `Trang ${slides.length + 1}`,
      background: "linear-gradient(135deg, #172554, #0f766e)",
      elements: [],
    };
    updateSlides([...slides, next]);
    setSlideIndex(slides.length);
    setSelectedId(null);
  };

  const duplicateSlide = () => {
    const copy = structuredClone(slides[slideIndex]);
    copy.id = makeId();
    copy.title += " - bản sao";
    copy.elements = copy.elements.map((item) => ({ ...item, id: makeId(), x: item.x + 16, y: item.y + 16 }));
    updateSlides([...slides.slice(0, slideIndex + 1), copy, ...slides.slice(slideIndex + 1)]);
    setSlideIndex(slideIndex + 1);
  };

  const deleteSlide = () => {
    if (slides.length === 1) return;
    const next = slides.filter((_, index) => index !== slideIndex);
    updateSlides(next);
    setSlideIndex(Math.max(0, slideIndex - 1));
  };

  const addElement = (type: ElementType) => {
    const id = makeId();
    const element: SlideElement = type === "text"
      ? { id, type, x: 250, y: 220, width: 460, height: 90, text: "Nhập nội dung", color: "#ffffff", animation: "fade" }
      : type === "image" && imageUrl
        ? { id, type, x: 320, y: 170, width: 320, height: 200, imageUrl, color: "#ffffff", animation: "zoom" }
        : { id, type: "shape", x: 340, y: 180, width: 280, height: 180, color: "#2563eb", animation: "fade" };
    updateSlide({ elements: [...slide.elements, element] });
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    updateSlide({ elements: slide.elements.filter((item) => item.id !== selectedId) });
    setSelectedId(null);
  };

  const savePresentation = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "presentations", user.uid), {
      ownerUid: user.uid,
      title: "Thuyết trình của tôi",
      slides,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
    setSaved(true);
  };

  const attachTransformer = (node: Konva.Node | null) => {
    if (node) {
      transformerRef.current?.nodes([node]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  };

  const openPresentation = () => {
    setPresentationIndex(slideIndex);
    setPresenting(true);
  };

  const changePresentationSlide = (direction: number) => {
    setPresentationIndex((current) => Math.min(slides.length - 1, Math.max(0, current + direction)));
  };

  return (
    <section className="presentation-app">
      <header className="editor-header">
        <div className="presentation-name">
          <span className="status-dot" />
          <input defaultValue="Thuyết trình của tôi" aria-label="Tên bài thuyết trình" />
          <span>{saved ? "Đã lưu" : "Chưa lưu"}</span>
        </div>
        <div className="editor-actions">
          <button className="tool-button" onClick={() => void savePresentation()}><Save size={17} /> Lưu</button>
          <button className="primary-button" onClick={openPresentation}><MonitorPlay size={17} /> Trình chiếu</button>
        </div>
      </header>

      <div className="editor-layout">
        <aside className="slide-rail">
          <div className="rail-heading">
            <span>Slide</span>
            <button className="round-button" onClick={addSlide} title="Thêm slide"><Plus size={17} /></button>
          </div>
          <div className="slide-list">
            {slides.map((item, index) => (
              <button key={item.id} className={`slide-thumbnail ${index === slideIndex ? "active" : ""}`} onClick={() => { setSlideIndex(index); setSelectedId(null); }}>
                <span className="slide-number">{index + 1}</span>
                <span className="thumbnail-canvas" style={{ background: item.background }}>
                  {item.elements.slice(0, 4).map((element) => (
                    <i key={element.id} style={{
                      left: `${element.x / 960 * 100}%`, top: `${element.y / 540 * 100}%`,
                      width: `${element.width / 960 * 100}%`, height: `${Math.max(3, element.height / 540 * 100)}%`,
                      background: element.color,
                    }} className={element.type} />
                  ))}
                </span>
              </button>
            ))}
          </div>
          <div className="rail-actions">
            <button onClick={duplicateSlide}><Copy size={16} /> Nhân bản</button>
            <button onClick={deleteSlide} disabled={slides.length === 1}><Trash2 size={16} /> Xóa</button>
          </div>
        </aside>

        <div className="canvas-area">
          <div className="canvas-toolbar">
            <button onClick={() => addElement("text")}><Type size={17} /> Văn bản</button>
            <button onClick={() => addElement("shape")}><Shapes size={17} /> Hình khối</button>
            <button onClick={() => addElement("image")} disabled={!imageUrl}>Ảnh media</button>
          </div>
          <div className="canvas-scroll">
            <div className="stage-frame" style={{ background: slide.background }}>
              <Stage width={WIDTH} height={HEIGHT} onMouseDown={(event) => {
                if (event.target === event.target.getStage()) setSelectedId(null);
              }}>
                <Layer>
                  <Rect width={WIDTH} height={HEIGHT} fill="rgba(0,0,0,0)" />
                  {slide.elements.map((element) => (
                    <CanvasElement
                      key={element.id}
                      element={element}
                      selected={element.id === selectedId}
                      attach={attachTransformer}
                      onSelect={() => setSelectedId(element.id)}
                      onChange={(patch) => updateElement(element.id, patch)}
                    />
                  ))}
                  {selectedId && <Transformer ref={transformerRef} />}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        <aside className="properties-panel">
          <h3>Thuộc tính</h3>
          {selected ? (
            <>
              <label>Vị trí X<input type="number" value={Math.round(selected.x)} onChange={(event) => updateElement(selected.id, { x: Number(event.target.value) })} /></label>
              <label>Vị trí Y<input type="number" value={Math.round(selected.y)} onChange={(event) => updateElement(selected.id, { y: Number(event.target.value) })} /></label>
              <label>Chiều rộng<input type="number" value={Math.round(selected.width)} onChange={(event) => updateElement(selected.id, { width: Number(event.target.value) })} /></label>
              <label>Màu sắc<input type="color" value={selected.color} onChange={(event) => updateElement(selected.id, { color: event.target.value })} /></label>
              {selected.type === "text" && <label>Nội dung<textarea rows={4} value={selected.text ?? ""} onChange={(event) => updateElement(selected.id, { text: event.target.value })} /></label>}
              <label>Hiệu ứng xuất hiện<select value={selected.animation} onChange={(event) => updateElement(selected.id, { animation: event.target.value as AnimationType })}>
                <option value="none">Không</option>
                <option value="fade">Mờ dần</option>
                <option value="slide">Trượt vào</option>
                <option value="zoom">Phóng to</option>
              </select></label>
              <button className="delete-object" onClick={removeSelected}><Trash2 size={16} /> Xóa đối tượng</button>
            </>
          ) : (
            <div className="empty-properties">Chọn một đối tượng để chỉnh sửa.</div>
          )}
          <div className="background-control">
            <label>Nền slide<input type="color" value="#172554" onChange={(event) => updateSlide({ background: `linear-gradient(135deg, ${event.target.value}, #0f766e)` })} /></label>
          </div>
        </aside>
      </div>

      {presenting && (
        <PresentationMode slide={slides[presentationIndex]} index={presentationIndex} total={slides.length}
          onPrev={() => changePresentationSlide(-1)} onNext={() => changePresentationSlide(1)}
          onClose={() => setPresenting(false)} />
      )}
    </section>
  );
}

function CanvasElement({ element, selected, attach, onSelect, onChange }: {
  element: SlideElement; selected: boolean; attach: (node: Konva.Node | null) => void;
  onSelect: () => void; onChange: (patch: Partial<SlideElement>) => void;
}) {
  const common = {
    x: element.x, y: element.y, width: element.width, height: element.height,
    draggable: true, onClick: onSelect, onTap: onSelect,
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) =>
      onChange({ x: event.target.x(), y: event.target.y() }),
    ref: (node: Konva.Node | null) => { if (selected) attach(node); },
  };
  if (element.type === "text") {
    return <Text {...common} text={element.text} fontSize={46} fontFamily="Segoe UI" fontStyle="bold" fill={element.color}
      onDblClick={() => { const text = window.prompt("Nội dung", element.text ?? ""); if (text !== null) onChange({ text }); }} />;
  }
  if (element.type === "image" && element.imageUrl) {
    return <LoadedCanvasImage {...common} src={element.imageUrl} />;
  }
  return <Rect {...common} fill={element.color} cornerRadius={16} shadowColor="#00000033" shadowBlur={18} shadowOffsetY={8} />;
}

function LoadedCanvasImage({ src, ...props }: {
  src: string; x: number; y: number; width: number; height: number; draggable: boolean;
  onClick: () => void; onTap: () => void; ref: (node: Konva.Node | null) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const next = new window.Image();
    next.crossOrigin = "anonymous";
    next.onload = () => setImage(next);
    next.src = src;
  }, [src]);
  return image ? <KonvaImage {...props} image={image} cornerRadius={18} /> : null;
}

function PresentationMode({ slide, index, total, onPrev, onNext, onClose }: {
  slide: Slide; index: number; total: number; onPrev: () => void; onNext: () => void; onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") onNext();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev, onClose]);

  useEffect(() => {
    const targets = stageRef.current?.querySelectorAll("[data-animate]");
    targets?.forEach((target, position) => {
      gsap.killTweensOf(target);
      const animation = target.getAttribute("data-animation");
      gsap.set(target, { opacity: animation === "fade" ? 0 : 1, x: animation === "slide" ? 120 : 0, scale: animation === "zoom" ? 0.5 : 1 });
      gsap.to(target, { opacity: 1, x: 0, scale: 1, duration: 0.8, delay: 0.15 + position * 0.16, ease: "power3.out" });
    });
  }, [slide, index]);

  return (
    <div className="presentation-mode">
      <button className="present-close" onClick={onClose}>Thoát <Maximize2 size={16} /></button>
      <div ref={stageRef} className="presentation-stage" style={{ background: slide.background }}>
        {slide.elements.map((element) => (
          <div key={element.id} data-animate="true" data-animation={element.animation}
            className={`present-element ${element.type}`}
            style={{
              left: `${element.x / WIDTH * 100}%`, top: `${element.y / HEIGHT * 100}%`,
              width: `${element.width / WIDTH * 100}%`, height: `${element.height / HEIGHT * 100}%`,
              color: element.color, background: element.type === "shape" ? element.color : "transparent",
              backgroundImage: element.type === "image" ? `url(${element.imageUrl})` : undefined,
            }}>
            {element.type === "text" ? element.text : null}
          </div>
        ))}
      </div>
      <div className="presentation-controls">
        <button onClick={onPrev} disabled={index === 0}><ChevronLeft /></button>
        <span>{index + 1} / {total}</span>
        <button onClick={onNext} disabled={index === total - 1}><ChevronRight /></button>
      </div>
    </div>
  );
}
