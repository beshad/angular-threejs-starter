import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { EngineService } from "./engine.service";

@Component({
  selector: "app-engine",
  templateUrl: "./engine.component.html",
  styles: [
    `
      .btns {
        position: absolute;
        top: 10px;
        left: 10px;
      }
    `,
  ],
})
export class EngineComponent implements OnInit {
  avocado: boolean = false;
  toggle: boolean = false;

  @ViewChild("rendererCanvas", { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  public constructor(private engServ: EngineService) {}

  public ngOnInit(): void {
    this.engServ.createScene(this.rendererCanvas);
  }

  public tween = () => {
    this.engServ.tween();
  };

  public highlight = () => {
    this.avocado = !this.avocado;
    this.engServ.highlight(this.avocado);
  };

  public toggleLayer = () => {
    this.toggle = !this.toggle;
    this.engServ.toggleLayer(this.toggle);
  };
}
