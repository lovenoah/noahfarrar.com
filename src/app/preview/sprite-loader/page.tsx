import SpriteAssemblyLoader from "@/components/sprite-assembly-loader"

export const metadata = {
  title: "Sprite Runner",
}

export default function SpriteLoaderPreview() {
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
        <SpriteAssemblyLoader size={2} />
      </div>
    </>
  )
}
