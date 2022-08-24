// 必要なモジュールを読み込み
import * as THREE from "../lib/three.module.js";

// DOM がパースされたことを検出するイベントで App3 クラスをインスタンス化する
window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();

    // ロードが終わってから初期化し、描画する
    app.init();
    app.render();
  },
  false
);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 35,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 0.0,
      y: -1.0,
      z: 8.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xf5b2b2,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1.0, // 光の強度
      x: 1.0, // 光の向きを表すベクトルの X 要素
      y: 1.0, // 光の向きを表すベクトルの Y 要素
      z: 1.0, // 光の向きを表すベクトルの Z 要素
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.5, // 光の強度
    };
  }
  /**
   * マテリアル定義のための定数 @@@
   * 参考: https://threejs.org/docs/#api/en/materials/Material
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xa9ceec,
      opacity: 0.7, // 透明度
      side: THREE.DoubleSide, // 描画する面（カリングの設定）
    };
  }
  static get MATERIAL_PARAM_RED() {
    return {
      color: 0xff3333,
      opacity: 0.7, // 透明度
      side: THREE.DoubleSide, // 描画する面（カリングの設定）
    };
  }
  static get MATERIAL_PARAM_GREEN() {
    return {
      color: 0x33ff99,
      opacity: 0.7, // 透明度
      side: THREE.DoubleSide, // 描画する面（カリングの設定）
    };
  }
  static get MATERIAL_PARAM_YELLOW() {
    return {
      color: 0xffff33,
      opacity: 0.7, // 透明度
      side: THREE.DoubleSide, // 描画する面（カリングの設定）
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer; // レンダラ
    this.scene; // シーン
    this.camera; // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight; // アンビエントライト
    this.materialArray;
    this.BoxGeometry; // トーラスジオメトリ
    this.texture; // テクスチャ
    this.geometry;
    this.material;
    this.planeArray = [];
    this.materialArray = [];
    this.mesh;

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  /**
   * 初期化処理
   */
  init() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    const wrapper = document.querySelector("#webgl");
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      35,
      App3.CAMERA_PARAM.aspect,
      0.1,
      1000
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    for (let i = 0; i < 6; ++i) {
      this.geometry = new THREE.PlaneGeometry(5, 8);
      let loader = new THREE.TextureLoader();
      let imgPath = "./0" + (i + 1) + ".jpg";
      let texture = loader.load(imgPath); // テクスチャ読み込み
      let uniforms = {
        uTexture: { value: texture },
        uImageAspect: { value: 2512 / 4345 }, //画像のアスペクト
        uPlaneAspect: { value: 500 / 800 }, //プレーンのアスペクト
        uTime: { value: 0 },
      };
      this.material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: document.getElementById("v-shader").textContent,
        fragmentShader: document.getElementById("f-shader").textContent,
      });
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.planeArray.push(this.mesh);
      console.log(this.planeArray[i]);
      this.scene.add(this.planeArray[i]);

      this.materialArray.push(this.material);
    }

    this.camera.position.z = 40;

    let speed = 0;
    let rotation = 0;

    window.addEventListener("wheel", (event) => {
      speed += event.deltaY * 0.0002;
    });

    const rot = () => {
      rotation += speed;
      speed *= 0.93;
      const mathPositionRatio = (cube, multi) => {
        cube.position.x =
          12 * Math.cos(rotation + multi * (Math.PI / 3) + Math.PI / 6);
        cube.position.z =
          12 * Math.sin(rotation + multi * (Math.PI / 3) + Math.PI / 6);
      };
      let num = 1;
      this.planeArray.forEach((cube, index) => {
        mathPositionRatio(cube, index + num);
      });
      this.mesh.material.uniforms.uTime.value++;
      window.requestAnimationFrame(rot);
    };

    rot();
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);
    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
