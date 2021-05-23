import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ElementRef, Injectable, NgZone, OnDestroy } from "@angular/core";

import * as TWEEN from "@tweenjs/tween.js";
import { TweenLite, gsap, Linear } from "gsap";

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { of } from "rxjs";
import { AstVisitor } from "@angular/compiler";
import { WireframeGeometry } from "three";

@Injectable({ providedIn: "root" })
export class EngineService implements OnDestroy {
  #canvas: HTMLCanvasElement;
  #renderer: THREE.WebGLRenderer;
  #labelRenderer: CSS2DRenderer;
  #camera: THREE.PerspectiveCamera;
  #scene: THREE.Scene;
  #light: THREE.AmbientLight;
  #clock = new THREE.Clock();
  #avocadoMaterial: THREE.MeshBasicMaterial;

  selectedObject;

  #group = new THREE.Group();

  #raycaster = new THREE.Raycaster();
  #mouse = new THREE.Vector2();

  #controls: OrbitControls;
  #manager: THREE.LoadingManager;
  #box: THREE.Object3D;
  #cube: THREE.Mesh;
  #duck: THREE.Object3D;
  #avocado: THREE.Object3D;
  #anotherDuck: THREE.Object3D;
  #frameId: number = null;
  #loader: GLTFLoader;

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.#frameId != null) {
      cancelAnimationFrame(this.#frameId);
    }
  }

  #onDuckClicked = (event) => {
    this.#mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.#mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.#raycaster.setFromCamera(this.#mouse, this.#camera);

    // const mesh = <THREE.Mesh>this.#scene.getObjectByName('LOD3spShape')
    const intersects = this.#raycaster.intersectObjects(
      this.#anotherDuck.children,
      true
    );
    if (intersects.length > 0) {
      const color = new THREE.Color("#ff00ff");

      const mesh = <THREE.Mesh>intersects[0].object;
      TweenLite.to((<any>mesh).material.color, 1, {
        r: color.r,
        g: color.g,
        b: color.b,
      });
    }
  };

  #addMouseOverSprites = () => {
    const sprite1 = new THREE.Sprite(
      new THREE.SpriteMaterial({ color: "#69f" })
    );
    sprite1.position.set(5, 0, 5);
    sprite1.scale.set(1, 2, 1);
    sprite1.userData = { name: "sprite 1" };
    this.#group.add(sprite1);

    const sprite2 = new THREE.Sprite(
      new THREE.SpriteMaterial({ color: "#69f", sizeAttenuation: false })
    );
    sprite2.position.set(-5, 0, 3);
    sprite2.scale.set(0.1, 0.5, 0.1);
    sprite2.userData = { name: "sprite 2" };
    this.#group.add(sprite2);

    this.#scene.add(this.#group);
  };

  #onPointerMove = (event) => {
    if (this.selectedObject) {
      this.selectedObject.material.color.set("#69f");
      this.selectedObject.traverse((object) => {
        this.selectedObject.remove(object);
      });
      this.selectedObject = null;
    }
    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.#raycaster.setFromCamera(pointer, this.#camera);
    const intersects = this.#raycaster.intersectObject(this.#group, true);
    if (intersects.length > 0) {
      const res = intersects.filter((res) => {
        return res && res.object;
      })[0];

      if (res && res.object) {
        document.body.style.cursor = "pointer";
        this.selectedObject = res.object;
        const div = document.createElement("div");
        div.className = "label";
        div.innerHTML = res.object.userData.name;
        const label = new CSS2DObject(div);
        this.selectedObject.add(label);
        this.selectedObject.material.color.set("#f00");
      }
    } else {
      document.body.style.cursor = "default";
    }
  };

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.#canvas = canvas.nativeElement;
    this.#canvas.addEventListener("click", this.#onDuckClicked);
    this.#canvas.addEventListener("mousemove", this.#onPointerMove);
    this.#renderer = new THREE.WebGLRenderer({
      canvas: this.#canvas,
      alpha: true, // transparent background
      antialias: true, // smooth edges
    });
    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    this.#renderer.outputEncoding = THREE.sRGBEncoding;
    this.#labelRenderer = new CSS2DRenderer();
    this.#labelRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#labelRenderer.domElement);
    // create the scene
    this.#scene = new THREE.Scene();

    this.#manager = new THREE.LoadingManager();
    this.#loader = new GLTFLoader(this.#manager).setPath("../assets/");

    // setup camera
    this.#setCamera();

    // soft white light
    this.#setLights();
    this.#addMouseOverSprites();
    this.#scene.background = new THREE.Color(0x323232);
    // this.#scene.fog = new THREE.Fog(this.#scene.background, 1, 10)
    // this.#addSimpleGeometry()
    this.#loadSampleModel();
    this.#addAvocado();
    this.#addBottle();
    this.#setupControls();
    this.animate();
  }

  #addBottle = () => {
    this.#loader.load("texture-coordinate.glb", (glb) => {
      console.log(glb)
      this.#box = glb.scene;
      this.#box.position.set(0, 0, -5);
      this.#box.scale.set(2, 2, 2);
      this.#scene.add(this.#box);
    });
  };

  toggleLayer = (bool) => {
    var loader = new THREE.TextureLoader();
    this.#box.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry.clearGroups();
        mesh.geometry.addGroup(0, Infinity, 0);
        mesh.geometry.addGroup(0, Infinity, 1);
        // mesh.material.map = loader.load("https://picsum.photos/id/1013/100");
        mesh.material = new THREE.MeshBasicMaterial({
          // color: 0xff3333,
          map: loader.load("https://picsum.photos/id/1012/1000"),
          side: THREE.DoubleSide,
        });
      }
    });
  };

  #setCamera = () => {
    this.#camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.#camera.position.z = 10;
    this.#camera.position.y = 3;
    this.#camera.lookAt(this.#scene.position);
    this.#scene.add(this.#camera);
  };

  #addCSSLables = () => {
    const div = document.createElement("div");
    div.className = "label";
    // div.textContent = '<img href="https://www.picsum.photo/100>" CSS Lable'
    div.innerHTML = '<img src="../assets/lable.png"> CSS Lable';

    const lable = new CSS2DObject(div);
    lable.position.set(0, 2, 0);
    this.#anotherDuck.add(lable);
  };

  #setHelpers = () => {
    const axis = new THREE.AxesHelper(10);
    this.#scene.add(axis);

    // size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color
    const gridHelper = new THREE.GridHelper(10, 10);
    this.#scene.add(gridHelper);

    const camerahelper = new THREE.CameraHelper(this.#camera);
    this.#scene.add(camerahelper);

    const box = new THREE.BoxHelper(this.#duck, 0xffff00);
    this.#scene.add(box);
  };

  #setLights = () => {
    // const spotLight = new THREE.SpotLight(0xffffff)
    // spotLight.position.set(5, 0, 0)
    // this.#scene.add(spotLight)

    // const spotLightHelper = new THREE.SpotLightHelper(spotLight)
    // this.#scene.add(spotLightHelper)

    const ambient = new THREE.AmbientLight(0xffeedd, 0.5);
    this.#scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffeedd, 1);
    directional.position.y = 5;

    const helper = new THREE.DirectionalLightHelper(directional, 3, 0xff6666);
    this.#scene.add(helper);

    this.#scene.add(directional);

    // const hemisphereLight = new THREE.HemisphereLight(0x404040, 0xFFFFFF, 1)
    // hemisphereLight.position.y =10

    // const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 5)
    // this.#scene.add(hemisphereLightHelper)
    // this.#scene.add(hemisphereLight)
  };

  #addCanvasLable = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 200;
    canvas.style.cssText = `
       border:3px solid #fff
    `;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.font = "46px Arial";
    context.fillText("hello world!", 275, 110);

    const image = new Image();
    image.src = "../assets/lable.png";
    image.onload = (_) => {
      console.log(image.height);
      context.drawImage(image, 0, 55, 170, 85);
      const map = new THREE.Texture(canvas);
      map.needsUpdate = true;

      const marker = new THREE.SpriteMaterial({
        map: map,
        transparent: false,
        sizeAttenuation: true,
        color: 0xff6666,
      });

      var sprite = new THREE.Sprite(marker);
      sprite.scale.set(1, 0.5, 1);
      sprite.position.set(0, 2, 0);

      this.#duck.add(sprite);
    };
  };

  #addAvocado = () => {
    this.#loader.load("avocado.glb", (glb) => {
      this.#avocado = glb.scene;
      this.#avocado.position.set(5, 0, -5);
      this.#avocado.scale.set(50, 50, 50);
      this.#scene.add(this.#avocado);
      this.#avocadoMaterial = (<any>(
        this.#avocado.children[0]
      )).material.color.getHex();
    });
  };

  public highlight = (value) => {
    // if (glb instanceof THREE.Mesh) { }

    const target = <any>this.#avocado.children[0];
    const initial = new THREE.Color(target.material.color.getHex());
    const color = new THREE.Color(0xff6666);

    // let geometry = target.geometry
    // const wireframeGeometry = new THREE.WireframeGeometry(geometry)
    // const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 })
    // const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial)
    // this.#avocado.add(wireframe)

    // TweenLite.to(initial, 1, {
    //   r: color.r,
    //   g: color.g,
    //   b: color.b,
    //   onUpdate: () => {
    //     (<any>target).material.color = initial;
    //   }
    // })

    if (value) {
      TweenLite.to(initial, 1, {
        r: color.r,
        g: color.g,
        b: color.b,
        repeat: -1,
        ease: Linear.easeInOut,
        onUpdate: () => {
          (<any>target).material.color = initial;
        },
        onComplete: () => {
          //
        },
      });
    } else {
      (<any>target).material.color.setHex(this.#avocadoMaterial);
    }
  };

  #loadSampleModel = () => {
    // load terrain models
    this.#loader.load("duck.glb", (glb) => {
      glb.scene.traverse((child) => {
        if ((<THREE.Mesh>child).isMesh) {
          let model = <THREE.Mesh>child;
          model.receiveShadow = true;
          model.castShadow = true;
          this.#duck = glb.scene;
        }
      });

      this.#cloneThisModel(this.#duck);
      this.#addSpriteLable();
      this.#addCanvasLable();
      this.#addCSSLables();
      this.#scene.add(this.#duck);
      this.#setHelpers();
    });
  };

  #cloneThisModel = (model) => {
    this.#anotherDuck = model.clone();
    this.#anotherDuck.position.set(-5, 0, -5);
    this.#scene.add(this.#anotherDuck);
  };

  #setupControls = () => {
    // set controls
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.addEventListener("change", (e) => {
      // console.log(this.#controls.target)
    });
  };

  #addSpriteLable = () => {
    const map = new THREE.TextureLoader().load("../assets/lable.png");
    const material = new THREE.SpriteMaterial({ map: map });

    const sprite = new THREE.Sprite(material);
    TweenLite.to(sprite.position, 1, { y: 3 });
    // sprite.position.set(0, 3, 0)
    sprite.scale.set(1, 1, 1);
    this.#duck.add(sprite);
  };

  #addSimpleGeometry = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.#cube = new THREE.Mesh(geometry, material);
    this.#scene.add(this.#cube);
  };

  private animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular((_) => {
      if (document.readyState !== "loading") {
        this.render();
      } else {
        window.addEventListener("DOMContentLoaded", (_) => {
          this.render();
        });
      }

      window.addEventListener("resize", (_) => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.#frameId = requestAnimationFrame((_) => {
      this.render();
      let delta = this.#clock.getDelta();
      // console.log(delta)
      TWEEN.update();
    });

    // this.#cube.rotation.x += 0.01
    // this.#cube.rotation.y += 0.01
    // this.#duck.rotation.y +=0.01
    this.#renderer.render(this.#scene, this.#camera);
    this.#labelRenderer.render(this.#scene, this.#camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();

    this.#renderer.setSize(width, height);
  }

  tween = () => {
    TWEEN.removeAll();

    // this.#controls.target.x = 5
    // this.#camera.position.x = 5
    // this.#controls.target.set(5, 0, 0)
    // this.#camera.position.set(5,3,10)

    new TWEEN.Tween(this.#camera.position)
      .to(
        {
          x: 5,
          y: 3,
          z: 10,
        },
        1000
      )
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onStart((_) => {
        new TWEEN.Tween(this.#controls.target)
          .to(
            {
              x: 5,
              y: 0,
              z: 0,
            },
            1000
          )
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start();

        this.#controls.enabled = false;
      })
      .onUpdate((_) => {
        this.#controls.update();
        this.#camera.updateProjectionMatrix();
        this.#camera.updateMatrix();
      })
      .onComplete((_) => {
        this.#controls.update();
        this.#controls.enabled = true;
      })
      .start();
  };
}
