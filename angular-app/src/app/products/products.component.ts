import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CreateProductInput, Product, UpdateProductInput } from '../models';
import { ProductsService } from '../products.service';
import { RoleAccessBannerComponent } from '../role-access-banner/role-access-banner.component';
import { BrowserLoggerService } from '../telemetry/browser-logger.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RoleAccessBannerComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly logger = inject(BrowserLoggerService);

  public isLoading = true;
  public showAddProduct = false;
  public isSubmitting = false;
  public productsError: string | null = null;
  public formError: string | null = null;
  public exportMessage: string | null = null;
  public products: Product[] = [];
  public canManageProducts = false;
  public editingProductId: number | null = null;

  public productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  public editForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      void this.refreshState(this.auth.isAuthenticated());
    });
  }

  get userRoles(): string[] {
    return this.auth.userProfile()?.roles ?? [];
  }

  async ngOnInit() {
    if (!this.auth.isReady()) {
      await this.auth.initialize();
    }
  }

  public toggleAddProduct() {
    this.showAddProduct = !this.showAddProduct;
    this.editingProductId = null;
    this.formError = null;
    if (!this.showAddProduct) {
      this.productForm.reset();
    }
  }

  public startEdit(product: Product) {
    this.showAddProduct = false;
    this.editingProductId = product.id;
    this.formError = null;
    this.editForm.setValue({
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
    });
    window.setTimeout(() => {
      document.querySelector('.product-form-edit')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  public cancelEdit() {
    this.editingProductId = null;
    this.formError = null;
    this.editForm.reset();
  }

  public exportCatalog() {
    const payload = JSON.stringify(this.products, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'catalog-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    this.exportMessage = 'Catalog exported as catalog-export.json';
    window.setTimeout(() => (this.exportMessage = null), 2500);
  }

  public async submitProduct() {
    if (!this.canManageProducts || this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.formError = null;

    const value = this.productForm.getRawValue();
    const payload: CreateProductInput = {
      name: value.name?.trim() ?? '',
      description: value.description?.trim() || undefined,
      price: Number(value.price),
    };

    try {
      await this.auth.ensureFreshToken();
      this.logger.info('Creating product {name}', {
        event: 'products.create',
        name: payload.name,
      });
      await this.productsService.createProduct(payload);
      this.productForm.reset();
      this.showAddProduct = false;
      await this.loadProducts();
    } catch {
      this.formError = 'Unable to create product. Manager role is required.';
    } finally {
      this.isSubmitting = false;
    }
  }

  public async submitEdit(productId: number) {
    if (!this.canManageProducts || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.formError = null;

    const value = this.editForm.getRawValue();
    const payload: UpdateProductInput = {
      name: value.name?.trim() ?? '',
      description: value.description?.trim() || undefined,
      price: Number(value.price),
    };

    try {
      await this.auth.ensureFreshToken();
      await this.productsService.updateProduct(productId, payload);
      this.cancelEdit();
      await this.loadProducts();
    } catch {
      this.formError = 'Unable to update product. Manager role is required.';
    } finally {
      this.isSubmitting = false;
    }
  }

  public async deleteProduct(product: Product) {
    if (!this.canManageProducts) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    this.isSubmitting = true;
    this.formError = null;

    try {
      await this.auth.ensureFreshToken();
      await this.productsService.deleteProduct(product.id);
      if (this.editingProductId === product.id) {
        this.cancelEdit();
      }
      await this.loadProducts();
    } catch {
      this.formError = 'Unable to delete product. Manager role is required.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private async refreshState(authenticated: boolean) {
    this.isLoading = true;
    this.productsError = null;
    this.products = [];
    this.canManageProducts = false;
    this.showAddProduct = false;
    this.editingProductId = null;
    this.productForm.reset();
    this.editForm.reset();
    this.formError = null;
    this.exportMessage = null;

    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    this.canManageProducts = this.auth.getRoles().includes('manager');

    try {
      await this.loadProducts();
    } finally {
      this.isLoading = false;
    }
  }

  private async loadProducts() {
    if (!this.auth.isAuthenticated()) {
      this.products = [];
      return;
    }

    try {
      await this.auth.ensureFreshToken();
      this.products = await this.productsService.listProducts();
      this.productsError = null;
      this.logger.info('Loaded {count} products', {
        event: 'products.list',
        count: this.products.length,
      });
    } catch {
      this.productsError = 'We could not load products from the API gateway.';
      this.products = [];
      this.logger.warn('Failed to load products from API gateway', {
        event: 'products.list.error',
      });
    }
  }
}
