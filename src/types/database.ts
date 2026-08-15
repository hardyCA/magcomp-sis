export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number;
          nombre: string;
          descripcion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nombre: string;
          descripcion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nombre?: string;
          descripcion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          nombre: string;
          rol_id: number | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre?: string;
          rol_id?: number | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          rol_id?: number | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_rol_id_fkey";
            columns: ["rol_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categorias: {
        Row: {
          id: number;
          nombre: string;
          descripcion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nombre: string;
          descripcion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nombre?: string;
          descripcion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marcas: {
        Row: {
          id: number;
          nombre: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nombre: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nombre?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          id: number;
          nombre: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nombre: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nombre?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      productos: {
        Row: {
          id: number;
          codigo_barras: string | null;
          nombre: string;
          categoria_id: number | null;
          marca_id: number | null;
          stock: number;
          stock_minimo: number;
          imagen: string | null;
          precio_venta: number;
          moneda: "BOB" | "USD";
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          codigo_barras?: string | null;
          nombre: string;
          categoria_id?: number | null;
          marca_id?: number | null;
          stock?: number;
          stock_minimo?: number;
          imagen?: string | null;
          precio_venta?: number;
          moneda?: "BOB" | "USD";
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          codigo_barras?: string | null;
          nombre?: string;
          categoria_id?: number | null;
          marca_id?: number | null;
          stock?: number;
          stock_minimo?: number;
          imagen?: string | null;
          precio_venta?: number;
          moneda?: "BOB" | "USD";
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "productos_marca_id_fkey";
            columns: ["marca_id"];
            isOneToOne: false;
            referencedRelation: "marcas";
            referencedColumns: ["id"];
          },
        ];
      };
      movimientos_inventario: {
        Row: {
          id: number;
          producto_id: number;
          tipo_movimiento:
            | "ENTRADA"
            | "SALIDA"
            | "AJUSTE"
            | "VENTA"
            | "ANULACION";
          cantidad: number;
          stock_anterior: number;
          stock_nuevo: number;
          usuario_id: string | null;
          motivo: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          producto_id: number;
          tipo_movimiento:
            | "ENTRADA"
            | "SALIDA"
            | "AJUSTE"
            | "VENTA"
            | "ANULACION";
          cantidad: number;
          stock_anterior: number;
          stock_nuevo: number;
          usuario_id?: string | null;
          motivo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          producto_id?: number;
          tipo_movimiento?:
            | "ENTRADA"
            | "SALIDA"
            | "AJUSTE"
            | "VENTA"
            | "ANULACION";
          cantidad?: number;
          stock_anterior?: number;
          stock_nuevo?: number;
          usuario_id?: string | null;
          motivo?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "movimientos_inventario_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ventas: {
        Row: {
          id: number;
          numero: string;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          cliente_id: number | null;
          estado: "ACTIVA" | "ANULADA";
          motivo_anulacion: string | null;
          anulada_por: string | null;
          anulada_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          numero: string;
          usuario_id: string;
          fecha?: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal?: number;
          descuento?: number;
          total?: number;
          cliente_id?: number | null;
          estado?: "ACTIVA" | "ANULADA";
          motivo_anulacion?: string | null;
          anulada_por?: string | null;
          anulada_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          numero?: string;
          usuario_id?: string;
          fecha?: string;
          moneda?: "BOB" | "USD";
          tipo_cambio?: number;
          subtotal?: number;
          descuento?: number;
          total?: number;
          cliente_id?: number | null;
          estado?: "ACTIVA" | "ANULADA";
          motivo_anulacion?: string | null;
          anulada_por?: string | null;
          anulada_en?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ventas_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      detalle_ventas: {
        Row: {
          id: number;
          venta_id: number;
          producto_id: number;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Insert: {
          id?: number;
          venta_id: number;
          producto_id: number;
          cantidad: number;
          precio_unitario: number;
          subtotal?: number;
        };
        Update: {
          id?: number;
          venta_id?: number;
          producto_id?: number;
          cantidad?: number;
          precio_unitario?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "detalle_ventas_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: false;
            referencedRelation: "ventas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "detalle_ventas_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      cotizaciones: {
        Row: {
          id: number;
          numero: string;
          cliente: string | null;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
          venta_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          numero: string;
          cliente?: string | null;
          usuario_id: string;
          fecha?: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal?: number;
          descuento?: number;
          total?: number;
          estado?: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
          venta_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          numero?: string;
          cliente?: string | null;
          usuario_id?: string;
          fecha?: string;
          moneda?: "BOB" | "USD";
          tipo_cambio?: number;
          subtotal?: number;
          descuento?: number;
          total?: number;
          estado?: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
          venta_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cotizaciones_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cotizaciones_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: false;
            referencedRelation: "ventas";
            referencedColumns: ["id"];
          },
        ];
      };
      detalle_cotizaciones: {
        Row: {
          id: number;
          cotizacion_id: number;
          producto_id: number;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Insert: {
          id?: number;
          cotizacion_id: number;
          producto_id: number;
          cantidad: number;
          precio_unitario: number;
          subtotal?: number;
        };
        Update: {
          id?: number;
          cotizacion_id?: number;
          producto_id?: number;
          cantidad?: number;
          precio_unitario?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "detalle_cotizaciones_cotizacion_id_fkey";
            columns: ["cotizacion_id"];
            isOneToOne: false;
            referencedRelation: "cotizaciones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "detalle_cotizaciones_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      tipo_cambio: {
        Row: {
          id: number;
          valor: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          valor: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          valor?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      configuracion: {
        Row: {
          id: number;
          clave: string;
          valor: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          clave: string;
          valor?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          clave?: string;
          valor?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      modulos: {
        Row: {
          id: number;
          clave: string;
          nombre: string;
          orden: number;
        };
        Insert: {
          id?: number;
          clave: string;
          nombre: string;
          orden?: number;
        };
        Update: {
          id?: number;
          clave?: string;
          nombre?: string;
          orden?: number;
        };
        Relationships: [];
      };
      rol_permisos: {
        Row: {
          rol_id: number;
          modulo_id: number;
        };
        Insert: {
          rol_id: number;
          modulo_id: number;
        };
        Update: {
          rol_id?: number;
          modulo_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "rol_permisos_rol_id_fkey";
            columns: ["rol_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rol_permisos_modulo_id_fkey";
            columns: ["modulo_id"];
            isOneToOne: false;
            referencedRelation: "modulos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      obtener_usuarios: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          nombre: string;
          email: string;
          rol_id: number | null;
          rol_nombre: string | null;
          activo: boolean;
          created_at: string;
        }[];
      };
      permisos_usuario: {
        Args: Record<string, never>;
        Returns: string[];
      };
      registrar_movimiento_inventario: {
        Args: {
          p_producto_id: number;
          p_tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
          p_cantidad: number;
          p_motivo?: string | null;
        };
        Returns: {
          id: number;
          producto_id: number;
          tipo_movimiento: "ENTRADA" | "SALIDA" | "AJUSTE" | "VENTA";
          cantidad: number;
          stock_anterior: number;
          stock_nuevo: number;
          usuario_id: string | null;
          motivo: string | null;
          created_at: string;
        };
      };
      registrar_venta: {
        Args: {
          p_items: { producto_id: number; cantidad: number }[];
          p_moneda: "BOB" | "USD";
          p_cliente?: string | null;
          p_descuento?: number;
        };
        Returns: {
          id: number;
          numero: string;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          cliente_id: number | null;
          created_at: string;
        };
      };
      anular_venta: {
        Args: {
          p_venta_id: number;
          p_motivo?: string | null;
        };
        Returns: {
          id: number;
          numero: string;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          cliente_id: number | null;
          estado: "ACTIVA" | "ANULADA";
          motivo_anulacion: string | null;
          anulada_por: string | null;
          anulada_en: string | null;
          created_at: string;
        };
      };
      crear_cotizacion: {
        Args: {
          p_items: { producto_id: number; cantidad: number }[];
          p_cliente?: string | null;
          p_moneda: "BOB" | "USD";
          p_descuento?: number;
        };
        Returns: {
          id: number;
          numero: string;
          cliente: string | null;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
          venta_id: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      actualizar_cotizacion: {
        Args: {
          p_cotizacion_id: number;
          p_items: { producto_id: number; cantidad: number }[];
          p_cliente?: string | null;
          p_moneda: "BOB" | "USD";
          p_descuento?: number;
        };
        Returns: {
          id: number;
          numero: string;
          cliente: string | null;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
          venta_id: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      cambiar_estado_cotizacion: {
        Args: {
          p_cotizacion_id: number;
          p_estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
        };
        Returns: {
          id: number;
          numero: string;
          cliente: string | null;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA";
          venta_id: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      convertir_cotizacion_a_venta: {
        Args: {
          p_cotizacion_id: number;
        };
        Returns: {
          id: number;
          numero: string;
          usuario_id: string;
          fecha: string;
          moneda: "BOB" | "USD";
          tipo_cambio: number;
          subtotal: number;
          descuento: number;
          total: number;
          created_at: string;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
