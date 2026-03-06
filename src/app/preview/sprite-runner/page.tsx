import SpriteRunnerCard from "@/components/bridge/SpriteRunnerCard"

export const metadata = {
  title: "Sprite Runner",
}

export default function SpriteRunnerPreview() {
  return (
    <>
      <style>{`body > *:not(#preview-root) { display: none !important; } #preview-root { display: flex !important; }`}</style>
      <div
        id="preview-root"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F5F5",
        }}
      >
        <SpriteRunnerCard />
      </div>
    </>
  )
}
