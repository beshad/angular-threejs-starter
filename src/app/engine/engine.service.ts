import * as THREE from 'three'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core'

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js"

@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  #canvas: HTMLCanvasElement
  #renderer: THREE.WebGLRenderer
  #labelRenderer: CSS2DRenderer
  #camera: THREE.PerspectiveCamera
  #scene: THREE.Scene
  #light: THREE.AmbientLight

  #controls: OrbitControls
  #manager: THREE.LoadingManager

  #cube: THREE.Mesh
  #duck: THREE.Object3D
  #anotherDuck: THREE.Object3D
  #frameId: number = null

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.#frameId != null) {
      cancelAnimationFrame(this.#frameId)
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.#canvas = canvas.nativeElement

    this.#renderer = new THREE.WebGLRenderer({
      canvas: this.#canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    })
    this.#renderer.setSize(window.innerWidth, window.innerHeight)
    
    this.#labelRenderer = new CSS2DRenderer()
    this.#labelRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild( this.#labelRenderer.domElement )
    // create the scene
    this.#scene = new THREE.Scene()

    // setup camera
    this.#setCamera()

    // soft white light
    this.#setLights()

    this.#scene.background = new THREE.Color(0x323232)
    // this.#scene.fog = new THREE.Fog(this.#scene.background, 1, 10)
    // this.#addSimpleGeometry()
    this.#loadSampleModel()
    this.#setupControls()
    this.animate()
  }

  #setCamera = () => {
    this.#camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    )
    this.#camera.position.z = 10
    this.#camera.position.y = 3
    this.#camera.lookAt(this.#scene.position)
    this.#scene.add(this.#camera)
  }

  #addCSSLables = () => {

    const div = document.createElement('div')
    div.className = 'lable'
    // div.textContent = '<img href="https://www.picsum.photo/100>" CSS Lable' 
    div.innerHTML =  '<img src="../assets/lable.png"> CSS Lable'

    const lable = new CSS2DObject(div)
    lable.position.set(0, 2,0)
    this.#anotherDuck.add(lable)
  }

  #setHelpers = () => {
    const axis = new THREE.AxesHelper(10)
    this.#scene.add(axis)

    // size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color
    const gridHelper = new THREE.GridHelper(10, 10)
    this.#scene.add(gridHelper)

    const camerahelper = new THREE.CameraHelper(this.#camera)
    this.#scene.add(camerahelper)

    const box = new THREE.BoxHelper(this.#duck, 0xffff00)
    this.#scene.add(box)

  }

  #setLights = () => {

    // const spotLight = new THREE.SpotLight(0xffffff)
    // spotLight.position.set(5, 0, 0)
    // this.#scene.add(spotLight)

    // const spotLightHelper = new THREE.SpotLightHelper(spotLight)
    // this.#scene.add(spotLightHelper)

    const ambient = new THREE.AmbientLight(0xffeedd, 0.5)
    this.#scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xffeedd, 1)
    directional.position.y = 5

    const helper = new THREE.DirectionalLightHelper(directional, 3, 0xff6666)
    this.#scene.add(helper)

    this.#scene.add(directional)

    // const hemisphereLight = new THREE.HemisphereLight(0x404040, 0xFFFFFF, 1)
    // hemisphereLight.position.y =10

    // const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 5)
    // this.#scene.add(hemisphereLightHelper)
    // this.#scene.add(hemisphereLight)
  }

  #addCanvasLable = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 200
    canvas.style.cssText = `
       border:3px solid #fff
    `
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff';
    context.textAlign = 'center'
    context.font = '46px Arial'
    context.fillText("hello world!", 275, 110)

    const image = new Image()
    image.src = '../assets/lable.png'
    image.onload = _ => {
      console.log(image.height)
      context.drawImage(image, 0, 55, 170, 85)
      const map = new THREE.Texture(canvas)
      map.needsUpdate = true

      const marker = new THREE.SpriteMaterial({
        map: map,
        transparent: false,
        sizeAttenuation: true,
        color: 0xff6666
      })

      var sprite = new THREE.Sprite(marker)
      sprite.scale.set(1, 0.5, 1)
      sprite.position.set(0, 2, 0)

      this.#duck.add(sprite)
    }

  }

  #loadSampleModel = () => {
    // load terrain models
    this.#manager = new THREE.LoadingManager()
    const loader = new GLTFLoader(this.#manager).setPath('../assets/')
    loader.load('duck.glb', (gltf) => {
      this.#duck = gltf.scene
      this.#cloneThisModel (this.#duck)
      this.#addSpriteLable()
      this.#addCanvasLable()
      this.#addCSSLables()
      this.#scene.add(this.#duck)
      this.#setHelpers()
    })
    this.#manager.onLoad = () => {
      console.log('model loaded ...')
    }
  }

  #cloneThisModel = model => {
    this.#anotherDuck = model.clone()
    this.#anotherDuck.position.set(-5, 0 , -5)
    this.#scene.add(this.#anotherDuck)
  }

  #setupControls = () => {
    // set controls
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
    this.#controls.addEventListener('change', e => {
      // console.log(this.#controls.target)
    });
  }

  #addSpriteLable = () => {
    const map = new THREE.TextureLoader().load('../assets/lable.png')
    const material = new THREE.SpriteMaterial({ map: map })

    const sprite = new THREE.Sprite(material)
    sprite.position.set(0, 3, 0)
    sprite.scale.set(1, 1, 1)
    this.#duck.add(sprite)
  }

  #addSimpleGeometry = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.#cube = new THREE.Mesh(geometry, material)
    this.#scene.add(this.#cube)
  }

  private animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(_ => {
      if (document.readyState !== 'loading') {
        this.render()
      } else {
        window.addEventListener('DOMContentLoaded', _ => {
          this.render()
        })
      }

      window.addEventListener('resize', _ => {
        this.resize()
      })
    })
  }

  public render(): void {
    this.#frameId = requestAnimationFrame(_ => {
      this.render()
    })

    // this.#cube.rotation.x += 0.01
    // this.#cube.rotation.y += 0.01
    // this.#duck.rotation.y +=0.01
    this.#renderer.render(this.#scene, this.#camera)
    this.#labelRenderer.render(this.#scene, this.#camera)
  }

  public resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight

    this.#camera.aspect = width / height
    this.#camera.updateProjectionMatrix()

    this.#renderer.setSize(width, height)
  }
}
