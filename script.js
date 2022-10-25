// 必要なモジュールを読み込み
import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";
import { GUI } from "https://unpkg.com/three@0.127.0/examples/jsm/libs/dat.gui.module.js";
import { gsap } from "../node_modules/gsap/gsap-core.js";

// DOM がパースされたことを検出するイベントで App3 クラスをインスタンス化する
window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();
    app.load().then(() => {
      app.init();
      app.render();
    });
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
      clearColor: 0xe3d7bf,
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
    this.texture = []; // テクスチャ
    this.geometry;
    this.planeArray = [];
    this.materialArray = [];
    this.material;
    this.mesh;
    this.getViewSizeAtDepth = (depth = 0) => {
      const fovInRadians = (this.camera.fov * Math.PI) / 180;
      const height = Math.abs(
        (this.camera.position.z - depth) * Math.tan(fovInRadians / 2) * 2
      );
      return { width: height * this.camera.aspect, height };
    };

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
   * アセット（素材）のロードを行う Promise
   */
  load() {
    const imagePath = ["./01.jpg", "./02.jpg", "./03.jpg"];

    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      imagePath.forEach((img) => {
        loader.load(img, (texture) => {
          this.texture.push(texture);
          //テクスチャが画像の枚数と一致していれば解決
          this.texture.length === imagePath.length ? resolve() : "";
        });
      });
    });
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
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
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

    function loadFile(url, data) {
      var request = new XMLHttpRequest();
      request.open("GET", url, false);

      request.send(null);

      // リクエストが完了したとき
      if (request.readyState == 4) {
        // Http status 200 (成功)
        if (request.status == 200) {
          return request.responseText;
        } else {
          // 失敗
          console.log("error");
          return null;
        }
      }
    }

    let viewSize = this.getViewSizeAtDepth();
    this.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height);
    let uniforms = {
      uTexCurrent: { value: this.texture[0] },
      uTexNext: { value: this.texture[1] },
      uTick: { value: 0 },
      uProgress: { value: 0 },
      uNoiseScale: { value: new THREE.Vector2(4, 4) },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: loadFile("./shader.vert"),
      fragmentShader: loadFile("./shader.frag"),
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    const gui = new GUI({ width: 300 });
    gui.open();
    gui.add(this.material.uniforms.uNoiseScale.value, "x", 0, 100, 1);
    gui.add(this.material.uniforms.uNoiseScale.value, "y", 0, 100, 1);
    gui
      .add(this.material.uniforms.uProgress, "value", 0, 1, 0.1)
      .name("progress")
      .listen();

    const tl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      repeatDelay: 1.5,
      delay: 1,
    });

    tl.to(this.material.uniforms.uProgress, {
      value: 1,
      duration: 1.5,
      ease: "power3.inOut",
    });
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
