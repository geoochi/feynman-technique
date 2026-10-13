import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  OrthographicCamera,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from "three";
import type { ViewProps } from "../../../packages/core/types";
import { solarHour, dayLength, earthRotation } from "./model";
import s from "../../../packages/ui/Scene.module.css";
import earthTextureUrl from "./assets/earth-blue-marble.webp";
const vertexShader = `
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const fragmentShader = `
uniform vec3 sun;
uniform sampler2D surfaceMap;
uniform bool hasMap;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vec3 color = hasMap ? texture2D(surfaceMap, vUv).rgb : vec3(0.025, 0.12, 0.23);
  float light = dot(normalize(vNormal), normalize(sun));
  float day = smoothstep(-0.012, 0.012, light);
  color *= mix(0.06, 0.65 + 0.35 * max(light, 0.0), day);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`;
type TextureStatus = "loading" | "ready" | "failed";
function Earth({
  simulation,
  params: p,
  camera: distance,
  onTextureStatus,
}: ViewProps & { onTextureStatus: (status: TextureStatus) => void }) {
  const group = useRef<Group>(null),
    marker = useRef<Group>(null),
    material = useRef<ShaderMaterial>(null);
  const { camera, size, gl } = useThree();
  const [surfaceMap, setSurfaceMap] = useState<Texture | null>(null);
  useEffect(() => {
    let active = true;
    const texture = new TextureLoader().load(
      earthTextureUrl.src,
      () => {
        if (!active) return;
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        setSurfaceMap(texture);
        performance.mark("feynman:texture-ready");
        onTextureStatus("ready");
      },
      undefined,
      () => {
        if (active) onTextureStatus("failed");
      },
    );
    return () => {
      active = false;
      texture.dispose();
    };
  }, [gl, onTextureStatus]);
  useEffect(() => {
    let frame = 0;
    const before = gl.info.render.frame;
    const observe = () => {
      if (gl.info.render.frame > before) {
        if (!performance.getEntriesByName("feynman:canvas-first-frame").length) performance.mark("feynman:canvas-first-frame");
        if (surfaceMap && !performance.getEntriesByName("feynman:earth-ready").length) performance.mark("feynman:earth-ready");
      } else frame = requestAnimationFrame(observe);
    };
    frame = requestAnimationFrame(observe);
    return () => cancelAnimationFrame(frame);
  }, [gl, surfaceMap]);
  const uniforms = useMemo(
    () => ({
      sun: { value: new Vector3() },
      surfaceMap: { value: surfaceMap },
      hasMap: { value: surfaceMap !== null },
    }),
    [surfaceMap],
  );
  useEffect(() => {
    camera.position.set(-0.65, 1.4, distance);
    camera.lookAt(-0.65, 0, 0);
    if (camera instanceof OrthographicCamera) {
      camera.zoom =
        Math.min(size.width / 4.4, size.height / 3.8) * (5 / distance);
      camera.updateProjectionMatrix();
    }
  }, [camera, distance, size.width, size.height]);
  useFrame(() => {
    const params = simulation.params,
      hour = solarHour(params, simulation.state),
      phi = (params.latitude * Math.PI) / 180,
      delta = (params.declination * Math.PI) / 180;
    if (group.current) group.current.rotation.y = earthRotation(hour);
    if (marker.current)
      marker.current.position.set(
        -Math.cos(phi) * 1.03,
        Math.sin(phi) * 1.03,
        0,
      );
    if (material.current)
      material.current.uniforms.sun.value
        .set(-Math.cos(delta), Math.sin(delta), 0)
        .transformDirection(camera.matrixWorldInverse);
  });
  const delta = (p.declination * Math.PI) / 180;
  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[1, 64, 48]} />
          <shaderMaterial
            ref={material}
            toneMapped={false}
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
          />
        </mesh>
        <group ref={marker}>
          <mesh>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial color="#72c4ff" />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 2.7, 8]} />
        <meshBasicMaterial color="#c9800f" />
      </mesh>
      <group position={[0, 1.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.012, 8, 64, 1.5 * Math.PI]} />
          <meshBasicMaterial color="#c9800f" />
        </mesh>
        <mesh position={[0.045, 0, 0.3]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.045, 0.14, 12]} />
          <meshBasicMaterial color="#c9800f" />
        </mesh>
      </group>
      <group
        position={[-1.9 * Math.cos(delta), 1.9 * Math.sin(delta), 0]}
        rotation={[0, 0, -delta]}
      >
        {[-0.6, 0, 0.6].map((y) => (
          <group key={y} position={[0, y, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.008, 0.008, 0.8, 8]} />
              <meshBasicMaterial color="#c9800f" />
            </mesh>
            <mesh position={[0, 0.46, 0]}>
              <coneGeometry args={[0.055, 0.16, 12]} />
              <meshBasicMaterial color="#c9800f" />
            </mesh>
          </group>
        ))}
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.004, 4, 100]} />
        <meshBasicMaterial color="#577280" />
      </mesh>
    </>
  );
}
export default function DayNightView(props: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const [available, setAvailable] = useState<boolean | null>(null);
  const [textureStatus, setTextureStatus] = useState<TextureStatus>("loading");
  useEffect(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    setAvailable(!!gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return () => {
      c.width = 0;
      c.height = 0;
    };
  }, []);
  const length = dayLength(props.params.latitude, props.params.declination);
  return (
    <div className={s.scene}>
      <div className={s.globe}>
        {available && textureStatus !== "failed" ? (
          <Canvas
            role="img"
            aria-label={text.diagram}
            orthographic
            dpr={[1, 1.5]}
            camera={{ position: [-0.65, 1.4, 5], zoom: 100 }}
            fallback={
              <img
                className={s.fallback}
                src="/previews/day-night.svg"
                alt={text.staticDiagram}
              />
            }
          >
            <Earth {...props} onTextureStatus={setTextureStatus} />
          </Canvas>
        ) : (
          <img
            className={s.fallback}
            src="/previews/day-night.svg"
            alt={text.staticDiagram}
          />
        )}
        <span className={s.globeLabel}>SOLAR LIGHT → EARTH</span>
        {available && textureStatus === "ready" && (
          <a
            className={s.textureCredit}
            href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/"
            target="_blank"
            rel="noreferrer"
          >
            {text.credit}
          </a>
        )}
      </div>
      <p className={s.note}>
        {available === false
          ? text.noWebGL
          : textureStatus === "failed"
            ? text.textureFailed
            : available && textureStatus === "loading"
              ? text.loading
              : length === 24
                ? text.polarDay
                : length === 0
                  ? text.polarNight
                  : text.note}
      </p>
    </div>
  );
}
