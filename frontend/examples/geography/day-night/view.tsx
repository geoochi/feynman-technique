import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, ShaderMaterial, Vector3 } from "three";
import type { ViewProps } from "../../../packages/core/types";
import { solarAltitude, solarHour, dayLength } from "./model";
import s from "../../../packages/ui/Scene.module.css";
export { model } from "./model";
const vertexShader = `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragmentShader = `uniform vec3 sun; varying vec3 vNormal; varying vec3 vPosition;
void main(){vec3 p=normalize(vPosition);float lon=atan(p.z,p.x);float lat=asin(p.y);float land=sin(lon*3.0+sin(lat*4.0))*cos(lat*7.0)+sin(lon*7.0-lat*5.0)*0.35;vec3 color=mix(vec3(0.035,0.14,0.21),vec3(0.22,0.34,0.28),smoothstep(0.12,0.25,land));float gx=abs(sin(lon*12.0)),gy=abs(sin(lat*12.0));float grid=1.0-smoothstep(0.0,0.027,min(gx,gy));color=mix(color,vec3(0.35,0.51,0.57),grid*0.35);float light=dot(normalize(vNormal),normalize(sun));float day=smoothstep(-0.012,0.012,light);color*=mix(0.14,0.55+0.65*max(light,0.0),day);gl_FragColor=vec4(color,1.0);}`;
function Earth({ simulation, params: p, camera: distance }: ViewProps) {
  const group = useRef<Group>(null),
    marker = useRef<Group>(null),
    material = useRef<ShaderMaterial>(null);
  const { camera } = useThree();
  const uniforms = useMemo(() => ({ sun: { value: new Vector3() } }), []);
  useEffect(() => {
    camera.position.set(0, 1.4, distance);
    camera.lookAt(0, 0, 0);
  }, [camera, distance]);
  useFrame(() => {
    const params = simulation.params,
      hour = solarHour(params, simulation.state),
      phi = (params.latitude * Math.PI) / 180,
      delta = (params.declination * Math.PI) / 180;
    if (group.current) group.current.rotation.y = (-(hour - 12) * Math.PI) / 12;
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
        <meshBasicMaterial color="#d8b26a" />
      </mesh>
      {[-0.6, 0, 0.6].map((y, i) => (
        <mesh
          key={i}
          position={[-1.9 * Math.cos(delta), y + 1.9 * Math.sin(delta), 0]}
          rotation={[0, 0, -Math.PI / 2 - delta]}
        >
          <cylinderGeometry args={[0.006, 0.006, 0.8, 6]} />
          <meshBasicMaterial color="#d8b26a" />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.004, 4, 100]} />
        <meshBasicMaterial color="#577280" />
      </mesh>
    </>
  );
}
export default function DayNightView(props: ViewProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
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
  const hour = solarHour(props.params, props.state),
    altitude = solarAltitude(
      props.params.latitude,
      props.params.declination,
      hour,
    ),
    length = dayLength(props.params.latitude, props.params.declination);
  return (
    <div className={s.scene}>
      <div className={s.globe}>
        {available ? (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 1.4, 5], fov: 35 }}
            fallback={
              <img
                className={s.fallback}
                src="/previews/day-night.svg"
                alt="地球昼夜静态示意图"
              />
            }
          >
            <Earth {...props} />
          </Canvas>
        ) : (
          <img
            className={s.fallback}
            src="/previews/day-night.svg"
            alt="地球昼夜静态示意图"
          />
        )}
        <span className={s.globeLabel}>SOLAR LIGHT → EARTH</span>
      </div>
      <div className={s.caption}>
        <span>— 地轴 / 太阳光</span>
        <span>● 观察点</span>
        <span>
          {altitude > 0 ? "白昼" : "夜晚"} · 太阳高度 {altitude.toFixed(1)}°
        </span>
      </div>
      <div className={s.readings}>
        <div>
          <span>当前当地太阳时</span>
          <strong>
            {String(Math.floor(hour)).padStart(2, "0")}:
            {String(Math.floor((hour % 1) * 60)).padStart(2, "0")}
            <small>h</small>
          </strong>
        </div>
        <div>
          <span>几何昼长</span>
          <strong>
            {length.toFixed(2)}
            <small>h</small>
          </strong>
        </div>
      </div>
      <p className={s.note}>
        {available === false
          ? "WebGL 不可用，显示静态示意图；参数与昼长计算仍可使用。"
          : length === 24
            ? "此处为极昼：太阳全天在地平线上方。"
            : length === 0
              ? "此处为极夜：太阳全天在地平线下方。"
              : "1 模拟秒 = 1 个太阳小时 · 金色地轴表示自转轴。"}
      </p>
    </div>
  );
}
