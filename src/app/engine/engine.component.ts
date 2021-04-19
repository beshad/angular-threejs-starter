import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EngineService} from './engine.service';

@Component({
  selector: 'app-engine',
  templateUrl: './engine.component.html',
  styles: [`
  .btns {
    position: absolute;
    top: 10px;
    left: 10px;
  }`]
})
export class EngineComponent implements OnInit {

  @ViewChild('rendererCanvas', {static: true})
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  public constructor(private engServ: EngineService) {
  }

  public ngOnInit(): void {
    this.engServ.createScene(this.rendererCanvas)
  }

  public tween = () => {
    this.engServ.tween()
  }

  public texture = () => {
    this.engServ.toggleTexture()
  }

}
